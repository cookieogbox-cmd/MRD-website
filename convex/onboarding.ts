import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "User not logged in" });
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User profile not found" });
  }
  return user;
}

// Break an answer into a set of normalized words (deduped per answer).
// Each distinct word counts once per person.
function extractWords(text: string): string[] {
  const matches = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // strip punctuation, keep letters/numbers across languages
    .split(/\s+/)
    .filter((w) => w.length >= 2); // ignore single chars
  return Array.from(new Set(matches));
}

// ─── Onboarding status ──────────────────────────────────────────────────────────

// Returns what the reader still needs to do after signing in.
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    return {
      hasUsername: Boolean(user.username),
      username: user.username ?? null,
      needsReferral: !user.referralAnswered,
    };
  },
});

// Quick availability check used while typing a username.
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const lower = args.username.trim().toLowerCase();
    if (lower.length < 3) return { available: false, reason: "too_short" as const };
    if (lower.length > 24) return { available: false, reason: "too_long" as const };
    if (!/^[a-z0-9_]+$/.test(lower)) return { available: false, reason: "invalid" as const };
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username_lower", (q) => q.eq("usernameLower", lower))
      .first();
    return { available: existing === null, reason: existing ? ("taken" as const) : ("ok" as const) };
  },
});

// ─── Set username (once) ──────────────────────────────────────────────────────────

export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.username) {
      throw new ConvexError({ code: "CONFLICT", message: "Username already set." });
    }
    const trimmed = args.username.trim();
    const lower = trimmed.toLowerCase();
    if (lower.length < 3 || lower.length > 24 || !/^[a-z0-9_]+$/.test(lower)) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Username must be 3-24 characters: letters, numbers, or underscores.",
      });
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username_lower", (q) => q.eq("usernameLower", lower))
      .first();
    if (existing) {
      throw new ConvexError({ code: "CONFLICT", message: "That username is already taken." });
    }
    await ctx.db.patch(user._id, { username: trimmed, usernameLower: lower });
    return { username: trimmed };
  },
});

// ─── Submit the "who led you here?" answer ──────────────────────────────────────

export const submitReferral = mutation({
  args: { answer: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.referralAnswered) {
      // Already answered — silently no-op so the prompt can't double count.
      return { ok: true };
    }
    const answer = args.answer.trim();
    if (answer.length === 0) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Please share a little about who led you here." });
    }
    if (answer.length > 500) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Please keep your answer under 500 characters." });
    }

    const now = new Date().toISOString();
    await ctx.db.insert("referralAnswers", {
      userId: user._id,
      username: user.username ?? "Anonymous",
      answer,
      createdAt: now,
    });

    // Write-time aggregation: bump a counter per distinct word for fast admin search.
    const words = extractWords(answer);
    for (const word of words) {
      const existing = await ctx.db
        .query("referralWordCounts")
        .withIndex("by_word", (q) => q.eq("word", word))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { count: existing.count + 1 });
      } else {
        await ctx.db.insert("referralWordCounts", { word, count: 1 });
      }
    }

    await ctx.db.patch(user._id, { referralAnswered: true });
    return { ok: true };
  },
});

// ─── Admin: word-frequency analytics ────────────────────────────────────────────

// How many people used a given word (or substring of a word) in their answer.
export const searchWord = query({
  args: { word: v.string() },
  handler: async (ctx, args) => {
    const term = args.word.trim().toLowerCase();
    if (term.length === 0) return { term, exact: 0, matches: [] as { word: string; count: number }[] };

    // Exact match (fast, indexed).
    const exactDoc = await ctx.db
      .query("referralWordCounts")
      .withIndex("by_word", (q) => q.eq("word", term))
      .unique();

    // Partial matches: scan the top words and filter by substring.
    // Bounded by taking the most-used words only.
    const top = await ctx.db
      .query("referralWordCounts")
      .withIndex("by_count")
      .order("desc")
      .take(500);
    const matches = top
      .filter((w) => w.word.includes(term))
      .map((w) => ({ word: w.word, count: w.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return {
      term,
      exact: exactDoc?.count ?? 0,
      matches,
    };
  },
});

// Top words overall — the leaderboard of "who led you here".
export const topWords = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 25, 100);
    const top = await ctx.db
      .query("referralWordCounts")
      .withIndex("by_count")
      .order("desc")
      .take(limit);
    return top.map((w) => ({ word: w.word, count: w.count }));
  },
});

// Recent raw answers for context.
export const recentAnswers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const rows = await ctx.db
      .query("referralAnswers")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    return rows.map((r) => ({
      _id: r._id,
      username: r.username,
      answer: r.answer,
      createdAt: r.createdAt,
    }));
  },
});

// Total number of answers collected.
export const totalAnswers = query({
  args: {},
  handler: async (ctx) => {
    // Counting via take on a reasonable upper bound. For large scale this would
    // move to a denormalized counter; fine for current volumes.
    const rows = await ctx.db.query("referralAnswers").withIndex("by_created").take(1000);
    return rows.length;
  },
});

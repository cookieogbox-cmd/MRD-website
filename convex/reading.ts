import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Helper: get current user or throw
async function requireUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not signed in" });
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  }
  return user;
}

// Helper: get current user from query ctx (returns null if not found)
async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

// ── Progress ─────────────────────────────────────────────

export const saveProgress = mutation({
  args: {
    episodeNumber: v.string(),
    progressPercent: v.number(),
    language: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("readingProgress")
      .withIndex("by_user_and_episode", (q) =>
        q.eq("userId", user._id).eq("episodeNumber", args.episodeNumber)
      )
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      if (args.progressPercent >= existing.progressPercent || args.completed) {
        await ctx.db.patch(existing._id, {
          progressPercent: args.progressPercent,
          language: args.language,
          completed: args.completed,
          lastReadAt: now,
        });
      }
    } else {
      await ctx.db.insert("readingProgress", {
        userId: user._id,
        episodeNumber: args.episodeNumber,
        progressPercent: args.progressPercent,
        language: args.language,
        completed: args.completed,
        lastReadAt: now,
      });
    }
  },
});

export const getProgress = query({
  args: { episodeNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("readingProgress")
      .withIndex("by_user_and_episode", (q) =>
        q.eq("userId", user._id).eq("episodeNumber", args.episodeNumber)
      )
      .unique();
  },
});

export const getReadingHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// ── Bookmarks ────────────────────────────────────────────

export const addBookmark = mutation({
  args: {
    episodeNumber: v.string(),
    sectionId: v.string(),
    sectionLabel: v.string(),
    progressPercent: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_episode", (q) =>
        q.eq("userId", user._id).eq("episodeNumber", args.episodeNumber)
      )
      .collect();

    const duplicate = existing.find((b) => b.sectionId === args.sectionId);
    if (duplicate) return duplicate._id;

    return await ctx.db.insert("bookmarks", {
      userId: user._id,
      episodeNumber: args.episodeNumber,
      sectionId: args.sectionId,
      sectionLabel: args.sectionLabel,
      progressPercent: args.progressPercent,
      createdAt: new Date().toISOString(),
    });
  },
});

export const removeBookmark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bm = await ctx.db.get(args.bookmarkId);
    if (!bm || bm.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your bookmark" });
    }
    await ctx.db.delete(args.bookmarkId);
  },
});

export const getBookmarks = query({
  args: { episodeNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_episode", (q) =>
        q.eq("userId", user._id).eq("episodeNumber", args.episodeNumber)
      )
      .order("desc")
      .collect();
  },
});

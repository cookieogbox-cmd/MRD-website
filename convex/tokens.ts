import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Token Balance ────────────────────────────────────────────────────────────

export const getMyBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const record = await ctx.db
      .query("tokenBalances")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return record?.balance ?? 0;
  },
});

// Internal: credit tokens to a user (called after purchase or promo redemption)
export const creditTokens = mutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("tokenBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (record) {
      await ctx.db.patch(record._id, {
        balance: record.balance + args.amount,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("tokenBalances", {
        userId: args.userId,
        balance: args.amount,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

// ─── Token Packs ─────────────────────────────────────────────────────────────

export const listPacks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tokenPacks").withIndex("by_order").order("asc").collect();
  },
});

export const listActivePacks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tokenPacks")
      .withIndex("by_active_order", (q) => q.eq("active", true))
      .order("asc")
      .collect();
  },
});

export const createPack = mutation({
  args: {
    name: v.string(),
    tokenAmount: v.number(),
    price: v.number(),
    active: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.insert("tokenPacks", { ...args, createdAt: new Date().toISOString() });
  },
});

export const updatePack = mutation({
  args: {
    id: v.id("tokenPacks"),
    name: v.optional(v.string()),
    tokenAmount: v.optional(v.number()),
    price: v.optional(v.number()),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const removePack = mutation({
  args: { id: v.id("tokenPacks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.id);
  },
});

// ─── Promo Codes ─────────────────────────────────────────────────────────────

export const listPromoCodes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("promoCodes").order("desc").collect();
  },
});

export const createPromoCode = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("free_tokens"), v.literal("discount")),
    tokenAmount: v.optional(v.number()),
    discountPercent: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    // Check for duplicate code
    const existing = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();
    if (existing) throw new ConvexError({ message: "Promo code already exists", code: "CONFLICT" });

    await ctx.db.insert("promoCodes", {
      ...args,
      code: args.code.toUpperCase(),
      usedCount: 0,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updatePromoCode = mutation({
  args: {
    id: v.id("promoCodes"),
    active: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
    tokenAmount: v.optional(v.number()),
    discountPercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const removePromoCode = mutation({
  args: { id: v.id("promoCodes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.id);
  },
});

// Redeem a promo code (user-facing) — only free_tokens type for now; discount handled at checkout
export const redeemPromoCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!promo || !promo.active)
      throw new ConvexError({ message: "Invalid or inactive promo code", code: "BAD_REQUEST" });

    if (promo.maxUses !== undefined && promo.usedCount >= promo.maxUses)
      throw new ConvexError({ message: "Promo code has reached its usage limit", code: "BAD_REQUEST" });

    if (promo.type === "free_tokens") {
      const amount = promo.tokenAmount ?? 0;
      if (amount <= 0) throw new ConvexError({ message: "Promo code has no token value", code: "BAD_REQUEST" });

      // Credit tokens
      const record = await ctx.db
        .query("tokenBalances")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      if (record) {
        await ctx.db.patch(record._id, {
          balance: record.balance + amount,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await ctx.db.insert("tokenBalances", {
          userId: user._id,
          balance: amount,
          updatedAt: new Date().toISOString(),
        });
      }

      await ctx.db.patch(promo._id, { usedCount: promo.usedCount + 1 });
      return { type: "free_tokens" as const, tokenAmount: amount };
    } else {
      // discount type — return discount info for use at checkout
      await ctx.db.patch(promo._id, { usedCount: promo.usedCount + 1 });
      return { type: "discount" as const, discountPercent: promo.discountPercent ?? 0 };
    }
  },
});

// ─── Episode Token Info ──────────────────────────────────────────────────────

export const getEpisodeTokenInfo = query({
  args: { episodeNumber: v.string() },
  handler: async (ctx, args) => {
    const episode = await ctx.db
      .query("episodes")
      .filter((q) => q.eq(q.field("number"), args.episodeNumber))
      .first();
    if (!episode) return null;
    return {
      tokenPrice: episode.tokenPrice ?? 0,
      expiryDays: episode.expiryDays ?? 30,
      status: episode.status,
    };
  },
});

// ─── Unlocks ─────────────────────────────────────────────────────────────────

export const getMyUnlocks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("unlocks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const checkUnlock = query({
  args: { episodeNumber: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const unlock = await ctx.db
      .query("unlocks")
      .withIndex("by_user_and_episode", (q) =>
        q.eq("userId", user._id).eq("episodeNumber", args.episodeNumber)
      )
      .unique();

    if (!unlock) return null;

    // Check if expired
    const now = new Date();
    const expiry = new Date(unlock.expiresAt);
    if (now > expiry) return { expired: true, expiresAt: unlock.expiresAt };

    return { expired: false, expiresAt: unlock.expiresAt };
  },
});

export const unlockEpisode = mutation({
  args: { episodeNumber: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    // Get episode
    const episode = await ctx.db
      .query("episodes")
      .filter((q) => q.eq(q.field("number"), args.episodeNumber))
      .first();
    if (!episode) throw new ConvexError({ message: "Episode not found", code: "NOT_FOUND" });

    const tokenCost = episode.tokenPrice ?? 0;
    const expiryDays = episode.expiryDays ?? 30;

    // Check existing valid unlock
    const existing = await ctx.db
      .query("unlocks")
      .withIndex("by_user_and_episode", (q) =>
        q.eq("userId", user._id).eq("episodeNumber", args.episodeNumber)
      )
      .unique();

    if (existing) {
      const now = new Date();
      const expiry = new Date(existing.expiresAt);
      if (now <= expiry) {
        throw new ConvexError({ message: "Episode already unlocked and access is still active", code: "CONFLICT" });
      }
    }

    // Check balance
    const balanceRecord = await ctx.db
      .query("tokenBalances")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const currentBalance = balanceRecord?.balance ?? 0;
    if (currentBalance < tokenCost) {
      throw new ConvexError({ message: "Insufficient token balance", code: "BAD_REQUEST" });
    }

    // Deduct tokens
    if (balanceRecord) {
      await ctx.db.patch(balanceRecord._id, {
        balance: currentBalance - tokenCost,
        updatedAt: new Date().toISOString(),
      });
    }

    // Compute expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create or replace unlock
    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt: expiresAt.toISOString() });
    } else {
      await ctx.db.insert("unlocks", {
        userId: user._id,
        episodeNumber: args.episodeNumber,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    return { tokensSpent: tokenCost, newBalance: currentBalance - tokenCost, expiresAt: expiresAt.toISOString() };
  },
});

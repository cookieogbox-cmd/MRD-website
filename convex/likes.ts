import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const targetType = v.union(v.literal("book"), v.literal("episode"));

async function currentUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  return user?._id ?? null;
}

// Count real likes for a target by scanning its (small) index range.
async function realLikeCount(
  ctx: QueryCtx | MutationCtx,
  type: "book" | "episode",
  key: string
) {
  const rows = await ctx.db
    .query("likes")
    .withIndex("by_target", (q) => q.eq("targetType", type).eq("targetKey", key))
    .collect();
  return rows.length;
}

// Public: total like count (base seeded + real) and whether the viewer liked it.
export const getLikeState = query({
  args: { targetType, targetKey: v.string(), baseLikes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const real = await realLikeCount(ctx, args.targetType, args.targetKey);
    const userId = await currentUserId(ctx);
    let liked = false;
    if (userId) {
      const existing = await ctx.db
        .query("likes")
        .withIndex("by_user_and_target", (q) =>
          q.eq("userId", userId).eq("targetType", args.targetType).eq("targetKey", args.targetKey)
        )
        .unique();
      liked = !!existing;
    }
    return {
      total: (args.baseLikes ?? 0) + real,
      real,
      liked,
    };
  },
});

// Public: the most recent real likers for a target (names only), newest first.
export const recentLikers = query({
  args: { targetType, targetKey: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetKey", args.targetKey)
      )
      .order("desc")
      .take(args.limit ?? 8);

    const names = await Promise.all(
      rows.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          id: r._id,
          name: user?.name ?? "A reader",
          createdAt: r.createdAt,
        };
      })
    );
    return names;
  },
});

// Toggle the viewer's like on a target. Returns the new liked state.
export const toggleLike = mutation({
  args: { targetType, targetKey: v.string() },
  handler: async (ctx, args): Promise<{ liked: boolean }> => {
    const userId = await currentUserId(ctx);
    if (!userId) {
      throw new ConvexError({ message: "Sign in to like", code: "UNAUTHENTICATED" });
    }
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_target", (q) =>
        q.eq("userId", userId).eq("targetType", args.targetType).eq("targetKey", args.targetKey)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }
    await ctx.db.insert("likes", {
      userId,
      targetType: args.targetType,
      targetKey: args.targetKey,
      createdAt: new Date().toISOString(),
    });
    return { liked: true };
  },
});

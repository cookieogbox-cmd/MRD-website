import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// ── Queries ────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    return await ctx.storage.generateUploadUrl();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const episodes = await ctx.db
      .query("upcomingEpisodes")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return await Promise.all(
      episodes.map(async (ep) => ({
        ...ep,
        resolvedCoverUrl: ep.coverStorageId
          ? await ctx.storage.getUrl(ep.coverStorageId)
          : ep.coverUrl ?? null,
      }))
    );
  },
});

// ── Mutations (admin only) ──────────────────────────────────

export const create = mutation({
  args: {
    title: v.string(),
    chapter: v.string(),
    description: v.string(),
    releaseDate: v.optional(v.string()),
    status: v.union(v.literal("coming_soon"), v.literal("released")),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }
    return await ctx.db.insert("upcomingEpisodes", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("upcomingEpisodes"),
    title: v.optional(v.string()),
    chapter: v.optional(v.string()),
    description: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("coming_soon"), v.literal("released"))),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("upcomingEpisodes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }
    const ep = await ctx.db.get(args.id);
    if (ep?.coverStorageId) {
      await ctx.storage.delete(ep.coverStorageId);
    }
    await ctx.db.delete(args.id);
  },
});

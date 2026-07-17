import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

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
    const blocks = await ctx.db
      .query("contentBlocks")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return await Promise.all(
      blocks.map(async (b) => ({
        ...b,
        resolvedImageUrl: b.imageStorageId
          ? await ctx.storage.getUrl(b.imageStorageId)
          : b.imageUrl ?? null,
      }))
    );
  },
});

export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    const blocks = await ctx.db
      .query("contentBlocks")
      .withIndex("by_visible_order", (q) => q.eq("visible", true))
      .order("asc")
      .collect();
    return await Promise.all(
      blocks.map(async (b) => ({
        ...b,
        resolvedImageUrl: b.imageStorageId
          ? await ctx.storage.getUrl(b.imageStorageId)
          : b.imageUrl ?? null,
      }))
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    visible: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    return await ctx.db.insert("contentBlocks", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contentBlocks"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    visible: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("contentBlocks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const block = await ctx.db.get(args.id);
    if (block?.imageStorageId) {
      await ctx.storage.delete(block.imageStorageId);
    }
    await ctx.db.delete(args.id);
  },
});

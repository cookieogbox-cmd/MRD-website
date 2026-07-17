import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("vides")
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      results.page.map(async (vide) => {
        const videoUrl = await ctx.storage.getUrl(vide.videoStorageId);
        const thumbnailUrl = vide.thumbnailStorageId
          ? await ctx.storage.getUrl(vide.thumbnailStorageId)
          : null;
        return { ...vide, videoUrl, thumbnailUrl };
      })
    );

    return { ...results, page: enrichedPage };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    caption: v.string(),
    videoStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    await ctx.db.insert("vides", {
      authorId: user._id,
      authorName: user.name ?? identity.name ?? "Anonymous",
      caption: args.caption.trim(),
      videoStorageId: args.videoStorageId,
      thumbnailStorageId: args.thumbnailStorageId,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    });
  },
});

export const toggleLike = mutation({
  args: { videId: v.id("vides") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const existing = await ctx.db
      .query("videLikes")
      .withIndex("by_vide_and_user", (q) => q.eq("videId", args.videId).eq("userId", user._id))
      .first();

    const vide = await ctx.db.get(args.videId);
    if (!vide) throw new ConvexError({ message: "Vide not found", code: "NOT_FOUND" });

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.videId, { likeCount: Math.max(0, vide.likeCount - 1) });
      return { action: "unliked" as const };
    } else {
      await ctx.db.insert("videLikes", {
        videId: args.videId,
        userId: user._id,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.patch(args.videId, { likeCount: vide.likeCount + 1 });
      return { action: "liked" as const };
    }
  },
});

export const remove = mutation({
  args: { id: v.id("vides") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const vide = await ctx.db.get(args.id);
    if (!vide) throw new ConvexError({ message: "Vide not found", code: "NOT_FOUND" });
    if (vide.authorId !== user._id) throw new ConvexError({ message: "Not your video", code: "FORBIDDEN" });

    // Delete likes
    const likes = await ctx.db
      .query("videLikes")
      .withIndex("by_vide", (q) => q.eq("videId", args.id))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    await ctx.storage.delete(vide.videoStorageId);
    if (vide.thumbnailStorageId) await ctx.storage.delete(vide.thumbnailStorageId);
    await ctx.db.delete(args.id);
  },
});

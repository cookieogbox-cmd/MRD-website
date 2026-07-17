import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("vibes")
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      results.page.map(async (vibe) => {
        const imageUrl = await ctx.storage.getUrl(vibe.imageStorageId);
        return { ...vibe, imageUrl };
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
    imageStorageId: v.id("_storage"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    await ctx.db.insert("vibes", {
      authorId: user._id,
      authorName: user.name ?? identity.name ?? "Anonymous",
      caption: args.caption.trim(),
      imageStorageId: args.imageStorageId,
      tags: args.tags,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    });
  },
});

export const toggleLike = mutation({
  args: { vibeId: v.id("vibes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const existing = await ctx.db
      .query("vibeLikes")
      .withIndex("by_vibe_and_user", (q) => q.eq("vibeId", args.vibeId).eq("userId", user._id))
      .first();

    const vibe = await ctx.db.get(args.vibeId);
    if (!vibe) throw new ConvexError({ message: "Vibe not found", code: "NOT_FOUND" });

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.vibeId, { likeCount: Math.max(0, vibe.likeCount - 1) });
      return { action: "unliked" as const };
    } else {
      await ctx.db.insert("vibeLikes", {
        vibeId: args.vibeId,
        userId: user._id,
        createdAt: new Date().toISOString(),
      });
      await ctx.db.patch(args.vibeId, { likeCount: vibe.likeCount + 1 });
      return { action: "liked" as const };
    }
  },
});

export const remove = mutation({
  args: { id: v.id("vibes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const vibe = await ctx.db.get(args.id);
    if (!vibe) throw new ConvexError({ message: "Vibe not found", code: "NOT_FOUND" });
    if (vibe.authorId !== user._id) throw new ConvexError({ message: "Not your post", code: "FORBIDDEN" });

    // Delete likes
    const likes = await ctx.db
      .query("vibeLikes")
      .withIndex("by_vibe", (q) => q.eq("vibeId", args.id))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    await ctx.storage.delete(vibe.imageStorageId);
    await ctx.db.delete(args.id);
  },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

const GROUP_VALIDATOR = v.union(
  v.literal("general"),
  v.literal("scarheart"),
  v.literal("purple"),
  v.literal("gold-blue-green")
);

// Get top-level comments for a group (no parentId), newest first
export const getComments = query({
  args: { group: GROUP_VALIDATOR },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .order("desc")
      .collect();

    // Only top-level comments
    return comments.filter((c) => !c.parentId);
  },
});

// Get recent comments for a group (for homepage preview)
export const getRecentComments = query({
  args: { group: GROUP_VALIDATOR, limit: v.number() },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .order("desc")
      .take(args.limit);

    return comments.filter((c) => !c.parentId);
  },
});

// Get replies to a comment
export const getReplies = query({
  args: { parentId: v.id("comments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("asc")
      .collect();
  },
});

// Add a comment (auth required)
export const addComment = mutation({
  args: {
    group: GROUP_VALIDATOR,
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Sign in to comment", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    const content = args.content.trim();
    if (!content || content.length > 2000) {
      throw new ConvexError({ message: "Comment must be 1–2000 characters", code: "BAD_REQUEST" });
    }

    await ctx.db.insert("comments", {
      group: args.group,
      content,
      authorId: user._id,
      authorName: user.name ?? identity.name ?? "Reader",
      parentId: args.parentId,
      createdAt: new Date().toISOString(),
    });
  },
});

// Delete own comment
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Sign in required", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError({ message: "Comment not found", code: "NOT_FOUND" });
    }

    if (comment.authorId !== user._id) {
      throw new ConvexError({ message: "Cannot delete another reader's comment", code: "FORBIDDEN" });
    }

    // Delete replies first
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId as Id<"comments">))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(args.commentId);
  },
});

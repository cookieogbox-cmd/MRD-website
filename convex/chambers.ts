import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// ─── Chambers CRUD ──────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chambers").withIndex("by_order").order("asc").collect();
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("chambers").first();
    if (existing) return;

    const defaults = [
      { name: "General", description: "Hang out and chat about anything", icon: "💬", order: 1 },
      { name: "Theories", description: "Share your wildest fan theories", icon: "🧠", order: 2 },
      { name: "Fan Art", description: "Post and discuss fan creations", icon: "🎨", order: 3 },
      { name: "Spoilers", description: "Discuss plot spoilers freely", icon: "⚠️", order: 4 },
      { name: "Introductions", description: "Say hi and introduce yourself", icon: "👋", order: 5 },
    ];

    for (const chamber of defaults) {
      await ctx.db.insert("chambers", { ...chamber, createdAt: new Date().toISOString() });
    }
  },
});

// ─── Messages ───────────────────────────────────────────────────────────────

export const getMessages = query({
  args: {
    chamberId: v.id("chambers"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("chamberMessages")
      .withIndex("by_chamber", (q) => q.eq("chamberId", args.chamberId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with reactions (use array format since emoji keys aren't valid Convex field names)
    const enrichedPage = await Promise.all(
      results.page.map(async (msg) => {
        const reactions = await ctx.db
          .query("chamberReactions")
          .withIndex("by_message", (q) => q.eq("messageId", msg._id))
          .collect();

        // Group reactions by emoji into an array
        const grouped: { emoji: string; count: number; userIds: string[] }[] = [];
        for (const r of reactions) {
          const existing = grouped.find((g) => g.emoji === r.emoji);
          if (existing) {
            existing.count++;
            existing.userIds.push(r.userId);
          } else {
            grouped.push({ emoji: r.emoji, count: 1, userIds: [r.userId] });
          }
        }

        return { ...msg, reactions: grouped };
      })
    );

    return { ...results, page: enrichedPage };
  },
});

export const sendMessage = mutation({
  args: {
    chamberId: v.id("chambers"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    if (args.content.trim().length === 0) {
      throw new ConvexError({ message: "Message cannot be empty", code: "BAD_REQUEST" });
    }

    if (args.content.length > 2000) {
      throw new ConvexError({ message: "Message too long (max 2000 characters)", code: "BAD_REQUEST" });
    }

    await ctx.db.insert("chamberMessages", {
      chamberId: args.chamberId,
      authorId: user._id,
      authorName: user.name ?? identity.name ?? "Anonymous",
      content: args.content.trim(),
      createdAt: new Date().toISOString(),
    });
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("chamberMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new ConvexError({ message: "Message not found", code: "NOT_FOUND" });
    if (msg.authorId !== user._id) throw new ConvexError({ message: "Not your message", code: "FORBIDDEN" });

    // Delete reactions for this message
    const reactions = await ctx.db
      .query("chamberReactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
    for (const r of reactions) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(args.messageId);
  },
});

// ─── Admin: Create Chamber ──────────────────────────────────────────────────

export const createChamber = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const existing = await ctx.db.query("chambers").withIndex("by_order").order("desc").first();
    const nextOrder = existing ? existing.order + 1 : 1;
    await ctx.db.insert("chambers", {
      name: args.name.trim(),
      description: args.description.trim(),
      icon: args.icon.trim() || "💬",
      order: nextOrder,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateChamber = mutation({
  args: {
    id: v.id("chambers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteChamber = mutation({
  args: { id: v.id("chambers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    // Delete all messages in chamber
    const messages = await ctx.db
      .query("chamberMessages")
      .withIndex("by_chamber", (q) => q.eq("chamberId", args.id))
      .collect();
    for (const msg of messages) {
      const reactions = await ctx.db
        .query("chamberReactions")
        .withIndex("by_message", (q) => q.eq("messageId", msg._id))
        .collect();
      for (const r of reactions) await ctx.db.delete(r._id);
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("chamberMessages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    // Check if user already reacted with this emoji
    const existing = await ctx.db
      .query("chamberReactions")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id)
      )
      .collect();

    const existingReaction = existing.find((r) => r.emoji === args.emoji);

    if (existingReaction) {
      // Remove reaction
      await ctx.db.delete(existingReaction._id);
      return { action: "removed" as const };
    } else {
      // Add reaction
      await ctx.db.insert("chamberReactions", {
        messageId: args.messageId,
        userId: user._id,
        emoji: args.emoji,
        createdAt: new Date().toISOString(),
      });
      return { action: "added" as const };
    }
  },
});

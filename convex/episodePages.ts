import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    return await ctx.storage.generateUploadUrl();
  },
});

// Resolve a freshly uploaded storage id into a public URL (used for episode covers).
export const getUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const addPage = mutation({
  args: {
    episodeNumber: v.string(),
    language: v.string(),
    storageId: v.id("_storage"),
    order: v.number(),
    bookId: v.optional(v.id("books")),
    variantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.insert("episodePages", {
      episodeNumber: args.episodeNumber,
      language: args.language,
      storageId: args.storageId,
      order: args.order,
      bookId: args.bookId,
      variantId: args.variantId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const listPages = query({
  args: { episodeNumber: v.string(), language: v.string() },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("episodePages")
      .withIndex("by_episode_and_language", (q) =>
        q.eq("episodeNumber", args.episodeNumber).eq("language", args.language)
      )
      .order("asc")
      .collect();

    return await Promise.all(
      pages.map(async (page) => ({
        ...page,
        url: await ctx.storage.getUrl(page.storageId),
      }))
    );
  },
});

// Pages for a specific book's episode + language. Keeps each book's content
// fully separate so a new book never shows another book's pages.
export const listPagesByBook = query({
  args: { bookId: v.id("books"), episodeNumber: v.string(), language: v.string() },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("episodePages")
      .withIndex("by_book_episode_language", (q) =>
        q
          .eq("bookId", args.bookId)
          .eq("episodeNumber", args.episodeNumber)
          .eq("language", args.language)
      )
      .order("asc")
      .collect();

    return await Promise.all(
      pages.map(async (page) => ({
        ...page,
        url: await ctx.storage.getUrl(page.storageId),
      }))
    );
  },
});

// All pages for an episode, optionally narrowed to a single variant (scroll).
export const listByVariant = query({
  args: { episodeNumber: v.string(), variantId: v.string() },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("episodePages")
      .withIndex("by_episode_and_variant", (q) =>
        q.eq("episodeNumber", args.episodeNumber).eq("variantId", args.variantId)
      )
      .order("asc")
      .collect();

    return await Promise.all(
      pages.map(async (page) => ({
        ...page,
        url: await ctx.storage.getUrl(page.storageId),
      }))
    );
  },
});

export const deletePage = mutation({
  args: { id: v.id("episodePages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const page = await ctx.db.get(args.id);
    if (!page) throw new ConvexError({ message: "Page not found", code: "NOT_FOUND" });
    await ctx.storage.delete(page.storageId);
    await ctx.db.delete(args.id);
  },
});

// Swap the image on an existing page in place (keeps its order/position).
export const replacePage = mutation({
  args: { id: v.id("episodePages"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const page = await ctx.db.get(args.id);
    if (!page) throw new ConvexError({ message: "Page not found", code: "NOT_FOUND" });
    // Remove the old image so we don't leak storage.
    await ctx.storage.delete(page.storageId);
    await ctx.db.patch(args.id, { storageId: args.storageId });
  },
});

export const reorderPage = mutation({
  args: { id: v.id("episodePages"), newOrder: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.patch(args.id, { order: args.newOrder });
  },
});

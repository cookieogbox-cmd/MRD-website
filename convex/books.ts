import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

// LED color preset names available for books and the mini scroll
export const LED_PRESETS = [
  "red",
  "purple",
  "peacock-blue",
  "phthalo-green",
  "gold",
] as const;

const pageCountMode = v.union(
  v.literal("number"),
  v.literal("neverending"),
  v.literal("unknown"),
  v.literal("infinite")
);
const ledColorMode = v.union(v.literal("preset"), v.literal("custom"));
const readerCadence = v.union(
  v.literal("hourly"),
  v.literal("daily"),
  v.literal("weekly")
);
const bookStatus = v.union(v.literal("ongoing"), v.literal("complete"));

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  }
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

type BookDoc = Doc<"books">;

// Resolve a book's display cover: prefer an uploaded file, fall back to a URL.
async function withResolvedCover(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  book: BookDoc
) {
  const resolvedCoverUrl = book.coverStorageId
    ? await ctx.storage.getUrl(book.coverStorageId)
    : book.coverUrl ?? null;
  const resolvedLedCustomUrl = book.ledColorCustomStorageId
    ? await ctx.storage.getUrl(book.ledColorCustomStorageId)
    : book.ledColorCustomUrl ?? null;
  return { ...book, resolvedCoverUrl, resolvedLedCustomUrl };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db.query("books").withIndex("by_order").order("asc").collect();
    return await Promise.all(books.map((b) => withResolvedCover(ctx, b)));
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .order("asc")
      .collect();
    return await Promise.all(books.map((b) => withResolvedCover(ctx, b)));
  },
});

export const getById = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.id);
    if (!book) return null;
    return await withResolvedCover(ctx, book);
  },
});

// Resolve a book from a URL ref that may be a real book id, an order number
// ("1"), or a legacy chapter number ("01"). Falls back to the flagship so old
// links like /book/01 keep working and never show another book's content.
export const getByRef = query({
  args: { ref: v.string() },
  handler: async (ctx, args) => {
    // 1. Try a real document id.
    const asId = ctx.db.normalizeId("books", args.ref);
    if (asId) {
      const book = await ctx.db.get(asId);
      if (book) return await withResolvedCover(ctx, book);
    }
    // 2. Try matching a book's order number (e.g. "1" or "01").
    const n = Number(args.ref);
    if (Number.isFinite(n)) {
      const byOrder = await ctx.db
        .query("books")
        .withIndex("by_order", (q) => q.eq("order", n))
        .first();
      if (byOrder) return await withResolvedCover(ctx, byOrder);
    }
    // 3. Fall back to the flagship.
    const flagship = await ctx.db
      .query("books")
      .withIndex("by_flagship", (q) => q.eq("isFlagship", true))
      .first();
    if (flagship) return await withResolvedCover(ctx, flagship);
    return null;
  },
});

export const getFlagship = query({
  args: {},
  handler: async (ctx) => {
    const book = await ctx.db
      .query("books")
      .withIndex("by_flagship", (q) => q.eq("isFlagship", true))
      .first();
    if (!book) return null;
    return await withResolvedCover(ctx, book);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    languages: v.array(v.string()),
    synopsis: v.string(),
    status: bookStatus,
    pageCountMode,
    pageCount: v.optional(v.number()),
    ledColorMode,
    ledColorPreset: v.optional(v.string()),
    ledColorCustomUrl: v.optional(v.string()),
    ledColorCustomStorageId: v.optional(v.id("_storage")),
    realmId: v.id("realms"),
    defaultLight: v.string(),
    baseLikes: v.number(),
    baseReaders: v.number(),
    readerCadence,
    isFlagship: v.boolean(),
    published: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"books">> => {
    await requireAuth(ctx);
    // Only one flagship at a time: clear the flag on any existing flagship
    if (args.isFlagship) {
      const current = await ctx.db
        .query("books")
        .withIndex("by_flagship", (q) => q.eq("isFlagship", true))
        .collect();
      for (const b of current) {
        await ctx.db.patch(b._id, { isFlagship: false });
      }
    }
    return await ctx.db.insert("books", { ...args, createdAt: new Date().toISOString() });
  },
});

export const update = mutation({
  args: {
    id: v.id("books"),
    title: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    languages: v.optional(v.array(v.string())),
    synopsis: v.optional(v.string()),
    status: v.optional(bookStatus),
    pageCountMode: v.optional(pageCountMode),
    pageCount: v.optional(v.number()),
    ledColorMode: v.optional(ledColorMode),
    ledColorPreset: v.optional(v.string()),
    ledColorCustomUrl: v.optional(v.string()),
    ledColorCustomStorageId: v.optional(v.id("_storage")),
    realmId: v.optional(v.id("realms")),
    defaultLight: v.optional(v.string()),
    baseLikes: v.optional(v.number()),
    baseReaders: v.optional(v.number()),
    readerCadence: v.optional(readerCadence),
    isFlagship: v.optional(v.boolean()),
    published: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, ...fields } = args;
    // Enforce a single flagship
    if (fields.isFlagship === true) {
      const current = await ctx.db
        .query("books")
        .withIndex("by_flagship", (q) => q.eq("isFlagship", true))
        .collect();
      for (const b of current) {
        if (b._id !== id) await ctx.db.patch(b._id, { isFlagship: false });
      }
    }
    await ctx.db.patch(id, fields);
  },
});

export const setFlagship = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const current = await ctx.db
      .query("books")
      .withIndex("by_flagship", (q) => q.eq("isFlagship", true))
      .collect();
    for (const b of current) {
      if (b._id !== args.id) await ctx.db.patch(b._id, { isFlagship: false });
    }
    await ctx.db.patch(args.id, { isFlagship: true });
  },
});

export const remove = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});

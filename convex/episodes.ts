import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Validators shared across create/update for the per-book episode builder.
const scrollMode = v.union(v.literal("single"), v.literal("dual"));
const subtitleMode = v.union(
  v.literal("none"),
  v.literal("subtitled"),
  v.literal("both")
);
const readerCadence = v.union(
  v.literal("hourly"),
  v.literal("daily"),
  v.literal("weekly")
);
const variant = v.object({
  id: v.string(),
  label: v.string(),
  language: v.string(),
  subtitled: v.boolean(),
  pricing: v.union(v.literal("free"), v.literal("locked"), v.literal("sale")),
  tokenPrice: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  expiryDays: v.optional(v.number()),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("episodes").withIndex("by_order").order("asc").collect();
  },
});

export const listByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("episodes")
      .withIndex("by_book_and_order", (q) => q.eq("bookId", args.bookId))
      .order("asc")
      .collect();
  },
});

// A single episode within a book, looked up by its number. Used by the reader
// so each book's episode is resolved independently of any other book.
export const getByBookAndNumber = query({
  args: { bookId: v.id("books"), number: v.string() },
  handler: async (ctx, args) => {
    const eps = await ctx.db
      .query("episodes")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();
    return eps.find((e) => e.number === args.number) ?? null;
  },
});

export const listByChapterGroup = query({
  args: { chapterGroup: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("episodes")
      .withIndex("by_chapter_group", (q) => q.eq("chapterGroup", args.chapterGroup))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    number: v.string(),
    title: v.string(),
    subtitle: v.string(),
    synopsis: v.string(),
    cover: v.optional(v.string()),
    status: v.union(v.literal("free"), v.literal("coming"), v.literal("locked")),
    price: v.optional(v.number()),
    minutes: v.number(),
    tags: v.array(v.string()),
    arc: v.string(),
    langCount: v.number(),
    languages: v.optional(v.array(v.string())),
    chapterGroup: v.string(),
    order: v.number(),
    tokenPrice: v.optional(v.number()),
    expiryDays: v.optional(v.number()),
    bookId: v.optional(v.id("books")),
    scrollMode: v.optional(scrollMode),
    subtitleMode: v.optional(subtitleMode),
    defaultLight: v.optional(v.string()),
    baseLikes: v.optional(v.number()),
    baseReaders: v.optional(v.number()),
    readerCadence: v.optional(readerCadence),
    variants: v.optional(v.array(variant)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.insert("episodes", { ...args, createdAt: new Date().toISOString() });
  },
});

export const update = mutation({
  args: {
    id: v.id("episodes"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    cover: v.optional(v.string()),
    status: v.optional(v.union(v.literal("free"), v.literal("coming"), v.literal("locked"))),
    price: v.optional(v.number()),
    minutes: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    arc: v.optional(v.string()),
    langCount: v.optional(v.number()),
    languages: v.optional(v.array(v.string())),
    chapterGroup: v.optional(v.string()),
    tokenPrice: v.optional(v.number()),
    expiryDays: v.optional(v.number()),
    bookId: v.optional(v.id("books")),
    scrollMode: v.optional(scrollMode),
    subtitleMode: v.optional(subtitleMode),
    defaultLight: v.optional(v.string()),
    baseLikes: v.optional(v.number()),
    baseReaders: v.optional(v.number()),
    readerCadence: v.optional(readerCadence),
    variants: v.optional(v.array(variant)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("episodes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.id);
  },
});

// Seed 4 default episodes if none exist
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("episodes").first();
    if (existing) return;

    const defaults = [
      {
        number: "01",
        title: "Episode 1",
        subtitle: "Scar-heart Malka Raurah · Episode 1",
        synopsis: "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
        cover: "https://hercules-cdn.com/file_zwKoMroNRzrAPhnO04OOvFqt",
        status: "free" as const,
        minutes: 44,
        tags: ["Magic", "Memory", "Origin"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        chapterGroup: "01",
        order: 1,
      },
      {
        number: "02",
        title: "Episode 2",
        subtitle: "Scar-heart Malka Raurah · Episode 2",
        synopsis: "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
        cover: "https://hercules-cdn.com/file_Pjj1jCqzVtK2EmJFhyuBbOP0",
        status: "free" as const,
        minutes: 44,
        tags: ["Magic", "Memory", "Origin"],
        arc: "Arc I — The Forgetting",
        langCount: 1,
        chapterGroup: "01",
        order: 2,
      },
      {
        number: "ep03",
        title: "Episode 3",
        subtitle: "Scar-heart Malka Raurah · Episode 3",
        synopsis: "Beyond the city walls stands a gate no one has passed in a century. Malka has a key she doesn't remember acquiring — and something ancient is already waiting on the other side.",
        cover: "https://hercules-cdn.com/file_dsbSxaNfIx3OB5B7MWMKLiir",
        status: "coming" as const,
        minutes: 44,
        tags: ["Magic", "Mystery", "Threshold"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        chapterGroup: "01",
        order: 3,
      },
      {
        number: "ep04",
        title: "Episode 4",
        subtitle: "Scar-heart Malka Raurah · Episode 4",
        synopsis: "The memory-keepers have declared war on the scarred. Malka must choose: vanish into safety or ignite the rebellion the city has been holding its breath for.",
        cover: "https://hercules-cdn.com/file_hImXFPvfKor1NUph1wJ7x1vM",
        status: "coming" as const,
        minutes: 44,
        tags: ["Rebellion", "War", "Choice"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        chapterGroup: "01",
        order: 4,
      },
    ];

    for (const ep of defaults) {
      await ctx.db.insert("episodes", { ...ep, createdAt: new Date().toISOString() });
    }
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chapters").withIndex("by_order").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    number: v.string(),
    title: v.string(),
    subtitle: v.string(),
    synopsis: v.string(),
    cover: v.optional(v.string()),
    status: v.union(v.literal("free"), v.literal("coming"), v.literal("paid")),
    price: v.optional(v.number()),
    minutes: v.number(),
    tags: v.array(v.string()),
    arc: v.string(),
    langCount: v.number(),
    seriesColor: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const existing = await ctx.db.query("chapters").withIndex("by_number", (q) => q.eq("number", args.number)).first();
    if (existing) throw new ConvexError({ message: `Chapter ${args.number} already exists`, code: "CONFLICT" });
    await ctx.db.insert("chapters", { ...args, createdAt: new Date().toISOString() });
  },
});

export const update = mutation({
  args: {
    id: v.id("chapters"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    cover: v.optional(v.string()),
    status: v.optional(v.union(v.literal("free"), v.literal("coming"), v.literal("paid"))),
    price: v.optional(v.number()),
    minutes: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    arc: v.optional(v.string()),
    langCount: v.optional(v.number()),
    seriesColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    await ctx.db.delete(args.id);
  },
});

// Seed default 5 chapters if none exist
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("chapters").first();
    if (existing) return; // already seeded

    const defaults = [
      {
        number: "01",
        title: "Chapter 1",
        subtitle: "Scar-heart Malka Raurah · Chapter 1",
        synopsis: "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
        status: "free" as const,
        minutes: 44,
        tags: ["Magic", "Fantasy", "Rebellion"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        seriesColor: "Scar-heart Malka Raurah",
        order: 1,
      },
      {
        number: "02",
        title: "Chapter 2",
        subtitle: "MRD Green · Chapter 2",
        synopsis: "Coming soon.",
        status: "coming" as const,
        minutes: 44,
        tags: ["Magic", "Fantasy"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        seriesColor: "MRD Green",
        order: 2,
      },
      {
        number: "03",
        title: "Chapter 3",
        subtitle: "MRD Purple · Chapter 3",
        synopsis: "Coming soon.",
        status: "coming" as const,
        minutes: 44,
        tags: ["Magic", "Fantasy"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        seriesColor: "MRD Purple",
        order: 3,
      },
      {
        number: "04",
        title: "Chapter 4",
        subtitle: "MRD Blue · Chapter 4",
        synopsis: "Coming soon.",
        status: "coming" as const,
        minutes: 44,
        tags: ["Magic", "Fantasy"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        seriesColor: "MRD Blue",
        order: 4,
      },
      {
        number: "05",
        title: "Chapter 5",
        subtitle: "MRD Gold · Chapter 5",
        synopsis: "Coming soon.",
        status: "coming" as const,
        minutes: 44,
        tags: ["Magic", "Fantasy"],
        arc: "Arc I — The Forgetting",
        langCount: 18,
        seriesColor: "MRD Gold",
        order: 5,
      },
    ];

    for (const chapter of defaults) {
      await ctx.db.insert("chapters", { ...chapter, createdAt: new Date().toISOString() });
    }
  },
});

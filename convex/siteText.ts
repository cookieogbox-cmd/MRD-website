import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// The default copy for the homepage "Magical Must Note" block. Seeded once and
// fully editable by the admin afterwards.
const MUST_NOTE_KEY = "must_note";

const DEFAULT_MUST_NOTE = {
  key: MUST_NOTE_KEY,
  label: "Magical Must Note",
  title: "Magical Must Note",
  cta: "Click me: About Story",
  body:
    "The Chinese episode — accessed by changing the language in the library's top-right menu after clicking \"Begin Reading — Free\" — demonstrates how combining already spoken tongues like Francophone and Anglophone paired with Zulu and Swahili subtitles makes learning fun through storytelling (also made free for all African) with a story good enough to prompt users to demand more episodes, since a biweekly release cadence won't be enough.",
};

// Public: get a single text block by key.
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("siteText")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

// Admin: list every editable text block.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("siteText").collect();
  },
});

// Seed the default text blocks once (idempotent).
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("siteText")
      .withIndex("by_key", (q) => q.eq("key", MUST_NOTE_KEY))
      .unique();
    if (existing) return;
    await ctx.db.insert("siteText", {
      ...DEFAULT_MUST_NOTE,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Admin: update a text block's editable fields.
export const update = mutation({
  args: {
    id: v.id("siteText"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    cta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: new Date().toISOString() });
  },
});

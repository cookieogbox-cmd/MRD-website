import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("realms").withIndex("by_order").order("asc").collect();
  },
});

export const create = mutation({
  args: { name: v.string(), order: v.optional(v.number()) },
  handler: async (ctx, args): Promise<Id<"realms">> => {
    await requireAuth(ctx);
    let order = args.order;
    if (order === undefined) {
      const last = await ctx.db.query("realms").withIndex("by_order").order("desc").first();
      order = last ? last.order + 1 : 1;
    }
    return await ctx.db.insert("realms", {
      name: args.name,
      order,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("realms"), name: v.optional(v.string()), order: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("realms") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // Block deletion if any book still belongs to this realm
    const book = await ctx.db
      .query("books")
      .withIndex("by_realm", (q) => q.eq("realmId", args.id))
      .first();
    if (book) {
      throw new ConvexError({
        message: "Cannot delete a realm that still contains books",
        code: "CONFLICT",
      });
    }
    await ctx.db.delete(args.id);
  },
});

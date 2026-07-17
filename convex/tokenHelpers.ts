import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getPack = internalQuery({
  args: { packId: v.id("tokenPacks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.packId);
  },
});

export const getPromoByCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});

export const createPendingPurchase = internalMutation({
  args: {
    userId: v.id("users"),
    packId: v.id("tokenPacks"),
    tokenAmount: v.number(),
    pricePaid: v.number(),
    nonce: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tokenPurchases", {
      userId: args.userId,
      packId: args.packId,
      tokenAmount: args.tokenAmount,
      pricePaid: args.pricePaid,
      nonce: args.nonce,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

export const fulfillPurchase = internalMutation({
  args: { nonce: v.string() },
  handler: async (ctx, args) => {
    // Find the purchase by nonce
    const purchase = await ctx.db
      .query("tokenPurchases")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .unique();

    if (!purchase) return { success: false, balance: 0 };

    // Already fulfilled — return current balance (idempotent)
    if (purchase.status === "fulfilled") {
      const balanceRecord = await ctx.db
        .query("tokenBalances")
        .withIndex("by_user", (q) => q.eq("userId", purchase.userId))
        .unique();
      return { success: true, balance: balanceRecord?.balance ?? 0 };
    }

    // Credit tokens
    const balanceRecord = await ctx.db
      .query("tokenBalances")
      .withIndex("by_user", (q) => q.eq("userId", purchase.userId))
      .unique();

    const currentBalance = balanceRecord?.balance ?? 0;
    const newBalance = currentBalance + purchase.tokenAmount;

    if (balanceRecord) {
      await ctx.db.patch(balanceRecord._id, {
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("tokenBalances", {
        userId: purchase.userId,
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      });
    }

    // Mark as fulfilled
    await ctx.db.patch(purchase._id, {
      status: "fulfilled",
      fulfilledAt: new Date().toISOString(),
    });

    return { success: true, balance: newBalance };
  },
});

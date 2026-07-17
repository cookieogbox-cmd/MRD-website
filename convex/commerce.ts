"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { Hercules } from "@usehercules/sdk";

const hercules = new Hercules({
  apiKey: process.env.HERCULES_API_KEY!,
  apiVersion: "2025-12-09",
});

export const createCheckout = action({
  args: {
    variantId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string | null | undefined }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.runQuery(internal.commerceHelpers.getCurrentUser);
    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    let customerId = user.customerId;
    if (!customerId) {
      const customer = await hercules.commerce.customers.create({
        name: user.name ?? "Reader",
        email: user.email,
      });
      customerId = customer.id;
      await ctx.runMutation(internal.commerceHelpers.saveCustomerId, {
        userId: user._id,
        customerId,
      });
    }

    const session = await hercules.commerce.checkout({
      customer_id: customerId,
      line_items: [{ variant_id: args.variantId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
    });

    return { url: session.url };
  },
});

export const checkAccess = action({
  args: { resourceId: v.string() },
  handler: async (ctx, args): Promise<{ hasAccess: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { hasAccess: false };

    const user = await ctx.runQuery(internal.commerceHelpers.getCurrentUser);
    if (!user?.customerId) return { hasAccess: false };

    const result = await hercules.commerce.check({
      customer_id: user.customerId,
      resource_id: args.resourceId,
    });

    return { hasAccess: result.has_access };
  },
});

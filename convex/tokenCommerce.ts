"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Hercules } from "@usehercules/sdk";

const hercules = new Hercules({
  apiKey: process.env.HERCULES_API_KEY!,
  apiVersion: "2025-12-09",
});

// Create a checkout for a token pack purchase
export const purchaseTokenPack = action({
  args: {
    packId: v.id("tokenPacks"),
    successUrl: v.string(),
    cancelUrl: v.string(),
    promoCode: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ url: string | null | undefined; nonce: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    // Get user
    const user = await ctx.runQuery(internal.commerceHelpers.getCurrentUser);
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    // Get the token pack
    const pack = await ctx.runQuery(internal.tokenHelpers.getPack, { packId: args.packId });
    if (!pack || !pack.active) throw new ConvexError({ message: "Token pack not found or inactive", code: "NOT_FOUND" });

    // Apply promo code discount if any
    let finalPrice = pack.price; // in cents
    if (args.promoCode) {
      const promo = await ctx.runQuery(internal.tokenHelpers.getPromoByCode, { code: args.promoCode.toUpperCase() });
      if (promo && promo.active && promo.type === "discount") {
        const discount = promo.discountPercent ?? 0;
        finalPrice = Math.round(pack.price * (1 - discount / 100));
      }
    }

    // Create/get customer
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

    // Generate a unique nonce for this purchase
    const nonce = `tp_${user._id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Record pending purchase
    await ctx.runMutation(internal.tokenHelpers.createPendingPurchase, {
      userId: user._id,
      packId: args.packId,
      tokenAmount: pack.tokenAmount,
      pricePaid: finalPrice,
      nonce,
    });

    // Create a one-time product checkout via Hercules Commerce
    // We'll create a dynamic product for each purchase
    const product = await hercules.commerce.products.create({
      name: `${pack.name} (${pack.tokenAmount} Tokens)`,
      variants: [{
        name: pack.name,
        unit_amount: finalPrice,
        currency: "USD",
      }],
    });

    const variantId = product.variants[0].id;

    const session = await hercules.commerce.checkout({
      customer_id: customerId,
      line_items: [{ variant_id: variantId, quantity: 1 }],
      success_url: `${args.successUrl}?nonce=${encodeURIComponent(nonce)}`,
      cancel_url: args.cancelUrl,
    });

    return { url: session.url, nonce };
  },
});

// Fulfill the purchase — called after successful payment
export const fulfillTokenPurchase = action({
  args: { nonce: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; balance: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const result = await ctx.runMutation(internal.tokenHelpers.fulfillPurchase, { nonce: args.nonce });
    return result;
  },
});

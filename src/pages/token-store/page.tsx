import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Coins, Tag, Sparkles, ArrowRight, Feather, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ConvexError } from "convex/values";

function TokenBalanceDisplay() {
  const balance = useQuery(api.tokens.getMyBalance, {});
  if (balance === undefined) return <Skeleton className="h-8 w-20" />;
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
      <Coins className="w-4 h-4 text-primary" />
      <span className="font-bold text-sm">{balance ?? 0} tokens</span>
    </div>
  );
}

function PromoCodeRedeem() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const redeemPromo = useMutation(api.tokens.redeemPromoCode);

  const handleRedeem = async () => {
    if (!code.trim()) { toast.error("Enter a promo code."); return; }
    setLoading(true);
    try {
      const result = await redeemPromo({ code: code.trim() });
      if (result.type === "free_tokens") {
        toast.success(`You received ${result.tokenAmount} tokens!`);
      } else {
        toast.success(`${result.discountPercent}% discount applied to your next purchase!`);
      }
      setCode("");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Failed to redeem code.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 w-full max-w-md">
      <Input
        placeholder="Enter promo code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="uppercase font-mono"
        onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
      />
      <Button onClick={handleRedeem} disabled={loading} className="gap-2 cursor-pointer flex-shrink-0">
        <Tag className="w-4 h-4" /> {loading ? "Redeeming..." : "Redeem"}
      </Button>
    </div>
  );
}

function TokenPackCard({ pack, onBuy }: {
  pack: { _id: Id<"tokenPacks">; name: string; tokenAmount: number; price: number; order: number };
  onBuy: (packId: Id<"tokenPacks">) => void;
}) {
  const priceUsd = (pack.price / 100).toFixed(2);
  const perToken = (pack.price / 100 / pack.tokenAmount).toFixed(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: pack.order * 0.08, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer group"
        onClick={() => onBuy(pack._id)}
      >
        <CardContent className="p-6 flex flex-col items-center gap-4 text-center h-full">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Coins className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{pack.name}</h3>
            <p className="text-2xl font-bold text-primary mt-1">{pack.tokenAmount}</p>
            <p className="text-xs text-muted-foreground">tokens</p>
          </div>
          <div className="mt-auto pt-4 w-full space-y-2">
            <div className="text-xl font-bold">${priceUsd}</div>
            <p className="text-xs text-muted-foreground">${perToken} per token</p>
            <Button className="w-full cursor-pointer gap-2 mt-2">
              Buy Pack <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TokenStoreInner() {
  const packs = useQuery(api.tokens.listActivePacks, {});
  const purchaseAction = useAction(api.tokenCommerce.purchaseTokenPack);
  const fulfillAction = useAction(api.tokenCommerce.fulfillTokenPurchase);
  const [buyingPack, setBuyingPack] = useState<Id<"tokenPacks"> | null>(null);
  const [searchParams] = useSearchParams();

  // Check if we are returning from checkout
  const nonce = searchParams.get("nonce");
  const [fulfilled, setFulfilled] = useState(false);

  // Attempt fulfillment on return
  if (nonce && !fulfilled) {
    setFulfilled(true);
    fulfillAction({ nonce }).then((result) => {
      if (result.success) {
        toast.success(`Tokens credited! Your balance is now ${result.balance} tokens.`);
      }
    }).catch(() => {
      toast.error("Could not credit tokens. Please contact support.");
    });
  }

  const handleBuy = async (packId: Id<"tokenPacks">) => {
    setBuyingPack(packId);
    try {
      const result = await purchaseAction({
        packId,
        successUrl: window.location.origin + "/token-store",
        cancelUrl: window.location.href,
      });
      if (result.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setBuyingPack(null);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-md bg-background/70">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Feather className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm tracking-wide" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Peacock-Book
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/episodes" className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:block">
            Library
          </Link>
          <TokenBalanceDisplay />
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs mb-5">
            <Sparkles className="w-3 h-3" /> Token Store
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Buy Tokens
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Purchase tokens to unlock and read episodes. The more you buy, the better the value.
          </p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        {/* Balance + promo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <TokenBalanceDisplay />
            </div>
          </div>
          <PromoCodeRedeem />
        </div>

        {/* Packs grid */}
        {packs === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No token packs available yet</p>
            <p className="text-sm mt-1">Check back soon for available purchases.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packs.map((pack) => (
              <TokenPackCard key={pack._id} pack={pack} onBuy={handleBuy} />
            ))}
          </div>
        )}

        {buyingPack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card p-8 rounded-2xl text-center space-y-4 border border-border shadow-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">Opening checkout...</p>
              <p className="text-sm text-muted-foreground">A new tab will open for payment. Complete the purchase there.</p>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-muted/20 p-8">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { step: "1", title: "Buy Tokens", desc: "Purchase a token pack with real money" },
              { step: "2", title: "Unlock Episodes", desc: "Spend tokens to unlock episodes you want to read" },
              { step: "3", title: "Read & Enjoy", desc: "Access your unlocked episodes for the duration period" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {item.step}
                </div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TokenStorePage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="p-8 rounded-2xl border border-border bg-card/90 backdrop-blur-md flex flex-col items-center gap-4 max-w-sm">
            <Coins className="w-12 h-12 text-primary opacity-60" />
            <h2 className="text-2xl font-bold">Sign in to buy tokens</h2>
            <p className="text-muted-foreground">Create an account or sign in to access the Token Store and start reading.</p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-12 w-48" />
        </div>
      </AuthLoading>
      <Authenticated>
        <TokenStoreInner />
      </Authenticated>
    </>
  );
}

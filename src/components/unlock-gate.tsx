import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Lock, Coins, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";

type UnlockGateProps = {
  episodeNumber: string;
  episodeTitle: string;
  children: React.ReactNode;
};

/**
 * Wraps episode content. If the episode has a tokenPrice > 0, it checks
 * the user's unlock status and either shows the content or shows
 * an unlock prompt with token cost.
 */
export default function UnlockGate({ episodeNumber, episodeTitle, children }: UnlockGateProps) {
  return (
    <>
      <AuthLoading>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedGate episodeTitle={episodeTitle} />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedGate episodeNumber={episodeNumber} episodeTitle={episodeTitle}>
          {children}
        </AuthenticatedGate>
      </Authenticated>
    </>
  );
}

function UnauthenticatedGate({ episodeTitle }: { episodeTitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto px-6 py-16 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Lock className="w-7 h-7 text-primary" />
      </div>
      <h2
        className="text-2xl font-bold mb-3 text-foreground"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Sign in to read {episodeTitle}
      </h2>
      <p
        className="text-muted-foreground mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}
      >
        This episode requires tokens to unlock. Sign in to check your balance and start reading.
      </p>
      <SignInButton className="h-10 px-6" />
    </motion.div>
  );
}

function AuthenticatedGate({
  episodeNumber,
  episodeTitle,
  children,
}: {
  episodeNumber: string;
  episodeTitle: string;
  children: React.ReactNode;
}) {
  const [unlocking, setUnlocking] = useState(false);

  const unlockStatus = useQuery(api.tokens.checkUnlock, { episodeNumber });
  const balance = useQuery(api.tokens.getMyBalance, {});
  const episodeInfo = useQuery(api.tokens.getEpisodeTokenInfo, { episodeNumber });
  const unlockMutation = useMutation(api.tokens.unlockEpisode);

  // If loading
  if (unlockStatus === undefined || episodeInfo === undefined) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  // If episode has no token price (free), show content directly
  if (!episodeInfo || episodeInfo.tokenPrice === 0) {
    return <>{children}</>;
  }

  const tokenCost = episodeInfo.tokenPrice;
  const expiryDays = episodeInfo.expiryDays;

  // If user has an active (non-expired) unlock
  if (unlockStatus && !unlockStatus.expired) {
    return (
      <div>
        <UnlockBanner expiresAt={unlockStatus.expiresAt} />
        {children}
      </div>
    );
  }

  // Either no unlock or expired
  const isExpired = unlockStatus?.expired;
  const currentBalance = balance ?? 0;
  const canAfford = currentBalance >= tokenCost;

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const result = await unlockMutation({ episodeNumber });
      toast.success(
        `Unlocked! ${result.tokensSpent} tokens spent. Access expires in ${expiryDays} days.`
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to unlock episode");
      }
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto px-6 py-16 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        {isExpired ? (
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        ) : (
          <Lock className="w-7 h-7 text-primary" />
        )}
      </div>

      <h2
        className="text-2xl font-bold mb-3 text-foreground"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {isExpired ? "Access Expired" : `Unlock ${episodeTitle}`}
      </h2>

      <p
        className="text-muted-foreground mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}
      >
        {isExpired
          ? "Your access to this episode has expired. Unlock it again to continue reading."
          : `This episode costs ${tokenCost} tokens to unlock for ${expiryDays} days.`}
      </p>

      {/* Token info */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="w-4 h-4 text-primary" />
            <span>Your balance</span>
          </div>
          <span className="text-lg font-bold text-foreground">{currentBalance} tokens</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 text-primary" />
            <span>Cost to unlock</span>
          </div>
          <span className="text-lg font-bold text-primary">{tokenCost} tokens</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>Access duration</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{expiryDays} days</span>
        </div>
      </div>

      {/* Action buttons */}
      {canAfford ? (
        <Button
          onClick={handleUnlock}
          disabled={unlocking}
          className="w-full h-12 text-base cursor-pointer"
        >
          {unlocking ? (
            "Unlocking..."
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 mr-2" />
              Unlock for {tokenCost} Tokens
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-destructive font-medium">
            Not enough tokens. You need {tokenCost - currentBalance} more.
          </p>
          <Link to="/token-store">
            <Button className="w-full h-12 text-base cursor-pointer">
              <Coins className="w-5 h-5 mr-2" />
              Buy Tokens
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

/** Banner shown above content when access is active, showing expiry countdown */
function UnlockBanner({ expiresAt }: { expiresAt: string }) {
  const expiryDate = new Date(expiresAt);
  const timeLeft = formatDistanceToNow(expiryDate, { addSuffix: false });

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-sm">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <span
          className="text-muted-foreground flex-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}
        >
          Access active — expires in <span className="text-foreground font-medium">{timeLeft}</span>
        </span>
        <Clock className="w-3.5 h-3.5 text-primary/60" />
      </div>
    </div>
  );
}

/** Compact unlock indicator for episode cards */
export function EpisodeUnlockBadge({ episodeNumber }: { episodeNumber: string }) {
  const unlockStatus = useQuery(api.tokens.checkUnlock, { episodeNumber });

  if (!unlockStatus) return null;

  if (unlockStatus.expired) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" /> Expired
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 rounded-full px-2 py-0.5">
      <ShieldCheck className="w-3 h-3" /> Unlocked
    </span>
  );
}

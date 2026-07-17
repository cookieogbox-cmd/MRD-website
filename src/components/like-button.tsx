import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Heart, Users } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

// Compact number formatting: 88000 -> "88k", 1200000 -> "1.2M".
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  const v = n / 1_000_000;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
}

type LikeTarget = "book" | "episode";

function LikeButtonInner({
  targetType,
  targetKey,
  baseLikes,
  size = "md",
  showRecent = false,
}: {
  targetType: LikeTarget;
  targetKey: string;
  baseLikes: number;
  size?: "sm" | "md";
  showRecent?: boolean;
}) {
  const state = useQuery(api.likes.getLikeState, { targetType, targetKey, baseLikes });
  const recent = useQuery(
    api.likes.recentLikers,
    showRecent ? { targetType, targetKey, limit: 3 } : "skip"
  );
  const toggle = useMutation(api.likes.toggleLike);

  const handleClick = async () => {
    try {
      await toggle({ targetType, targetKey });
    } catch {
      toast.error("Could not update your like. Please try again.");
    }
  };

  const liked = state?.liked ?? false;
  const total = state?.total ?? baseLikes;
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const recentText =
    recent && recent.length > 0
      ? `Liked by ${recent.map((r) => r.name).join(", ")}${
          (state?.real ?? 0) > recent.length ? " and others" : ""
        }`
      : null;

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors cursor-pointer",
          liked
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
          textSize
        )}
        aria-pressed={liked}
      >
        <motion.span
          key={liked ? "liked" : "unliked"}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="inline-flex"
        >
          <Heart className={cn(iconSize, liked && "fill-current")} />
        </motion.span>
        <span className="font-semibold tabular-nums">{formatCount(total)}</span>
      </button>
      {showRecent && recentText && (
        <span className="text-[11px] text-muted-foreground/80 max-w-[16rem] truncate">
          {recentText}
        </span>
      )}
    </div>
  );
}

// A heart/like button with live count. Shows a static (non-interactive) count
// for signed-out readers so the base number is always visible.
export function LikeButton({
  targetType,
  targetKey,
  baseLikes,
  size = "md",
  showRecent = false,
}: {
  targetType: LikeTarget;
  targetKey: string;
  baseLikes: number;
  size?: "sm" | "md";
  showRecent?: boolean;
}) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <>
      <Authenticated>
        <LikeButtonInner targetType={targetType} targetKey={targetKey} baseLikes={baseLikes} size={size} showRecent={showRecent} />
      </Authenticated>
      <Unauthenticated>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-muted-foreground",
            textSize
          )}
          title="Sign in to like"
        >
          <Heart className={iconSize} />
          <span className="font-semibold tabular-nums">{formatCount(baseLikes)}</span>
        </span>
      </Unauthenticated>
    </>
  );
}

const CADENCE_LABEL: Record<string, string> = {
  hourly: "this hour",
  daily: "today",
  weekly: "this week",
};

// A small reader-estimate pill, e.g. "12.4k reading today".
export function ReaderCount({
  count,
  cadence,
  size = "md",
}: {
  count: number;
  cadence: string;
  size?: "sm" | "md";
}) {
  if (!count || count <= 0) return null;
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-accent",
        textSize
      )}
    >
      <Users className={iconSize} />
      <span className="font-semibold tabular-nums">{formatCount(count)}</span>
      <span className="opacity-80">reading {CADENCE_LABEL[cadence] ?? "now"}</span>
    </span>
  );
}

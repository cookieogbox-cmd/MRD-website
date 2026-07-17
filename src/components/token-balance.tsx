import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated } from "convex/react";

function TokenBalanceInner({ compact = false }: { compact?: boolean }) {
  const balance = useQuery(api.tokens.getMyBalance, {});

  if (balance === undefined) return <Skeleton className="h-7 w-16 rounded-full" />;

  return (
    <Link
      to="/token-store"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 hover:border-primary/60 transition-colors cursor-pointer ${compact ? "text-xs" : "text-sm"}`}
    >
      <Coins className={`text-primary ${compact ? "w-3 h-3" : "w-4 h-4"}`} />
      <span className="font-bold">{balance ?? 0}</span>
      {!compact && <span className="text-muted-foreground text-xs">tokens</span>}
    </Link>
  );
}

export default function TokenBalance({ compact = false }: { compact?: boolean }) {
  return (
    <Authenticated>
      <TokenBalanceInner compact={compact} />
    </Authenticated>
  );
}

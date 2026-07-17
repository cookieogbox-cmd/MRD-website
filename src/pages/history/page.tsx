import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { BookOpen, Clock, Feather, ChevronRight, BookmarkCheck, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { api } from "@/convex/_generated/api.js";
import { EPISODE_1 } from "@/pages/read/_data/episode-1.ts";

// Map episode number to static data
const EPISODE_MAP: Record<string, { title: string; cover: string; series: string }> = {
  "01": { title: EPISODE_1.title, cover: EPISODE_1.coverUrl, series: EPISODE_1.series },
};

function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-md bg-background/70">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Feather className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold tracking-widest text-primary uppercase" style={{ fontFamily: "'Cinzel Decorative', serif", letterSpacing: "0.12em" }}>
            MRD
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/episodes">
            <Button variant="ghost" size="sm" className="cursor-pointer text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-1.5" /> Episodes
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-primary text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Your Journey
          </p>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reading History
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
            Pick up where you left off.
          </p>
        </motion.div>

        <AuthLoading>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        </AuthLoading>

        <Unauthenticated>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-10 text-center"
          >
            <Feather className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sign in to track your reading
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}>
              Your progress, bookmarks, and reading history are saved when you're signed in.
            </p>
            <SignInButton />
          </motion.div>
        </Unauthenticated>

        <Authenticated>
          <HistoryList />
        </Authenticated>
      </div>
    </div>
  );
}

function HistoryList() {
  const history = useQuery(api.reading.getReadingHistory, {});

  if (history === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-2xl p-10 text-center"
      >
        <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          No reading history yet
        </h2>
        <p className="text-muted-foreground mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}>
          Start with Episode One — it's free.
        </p>
        <Link to="/read/01">
          <Button className="cursor-pointer">
            <BookOpen className="w-4 h-4 mr-2" /> Read Episode One
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {history.map((item) => {
        const ep = EPISODE_MAP[item.episodeNumber];
        return (
          <motion.div
            key={item._id}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
          >
            <Link to={`/read/${item.episodeNumber}`} className="block group">
              <div className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 flex gap-5 items-center transition-all hover:-translate-y-0.5">
                {/* Cover */}
                <div className="flex-shrink-0 relative">
                  {ep ? (
                    <img src={ep.cover} alt={ep.title} className="w-14 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  {item.completed && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <BookmarkCheck className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {ep?.series ?? "Scar-heart Malka Raurah"}
                      </p>
                      <h3 className="font-bold text-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Ep. {item.episodeNumber} — {ep?.title ?? "Episode"}
                      </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted mb-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatRelativeDate(item.lastReadAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-accent" /> {item.language}
                    </span>
                    <span>{item.progressPercent}% read</span>
                    {item.completed && (
                      <Badge className="text-xs py-0 px-2">Completed</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {/* Browse more CTA */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }}
        className="pt-4"
      >
        <Link to="/episodes">
          <Button variant="secondary" className="w-full cursor-pointer">
            <BookOpen className="w-4 h-4 mr-2" /> Browse More Episodes
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

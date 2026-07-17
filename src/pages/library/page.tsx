import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion } from "motion/react";
import { Library as LibraryIcon, BookOpen, Globe, Users, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { formatCount } from "@/components/like-button.tsx";

type SortOption = "newest" | "oldest" | "language" | "subtitled";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  language: "By Language",
  subtitled: "Subtitled First",
};

const CADENCE_LABEL: Record<string, string> = {
  hourly: "this hour",
  daily: "today",
  weekly: "this week",
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function LibraryPage() {
  const books = useQuery(api.books.listPublished, {});
  const realms = useQuery(api.realms.list, {});
  const flagship = useQuery(api.books.getFlagship, {});

  const [realmFilter, setRealmFilter] = useState<Id<"realms"> | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const loading = books === undefined || realms === undefined;

  // Reader estimate is taken from the flagship's admin-set base readers.
  const readerEstimate = flagship?.baseReaders ?? 0;
  const readerCadence = flagship?.readerCadence ?? "daily";

  let visible = (books ?? []).filter(
    (b) => realmFilter === "all" || b.realmId === realmFilter
  );

  visible = [...visible].sort((a, b) => {
    if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    if (sort === "language") {
      return (a.languages[0] ?? "").localeCompare(b.languages[0] ?? "");
    }
    // subtitled-first uses a loose heuristic: books listing more languages
    // tend to carry subtitle variants, so surface them first.
    if (sort === "subtitled") return b.languages.length - a.languages.length;
    return 0;
  });

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <motion.div
          className="max-w-5xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-primary text-xs tracking-widest uppercase mb-3"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            The Main Library
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            All Books
          </h1>
          <p
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Every published work across all realms. Tap a book to enter its
            world and browse its episodes.
          </p>

          {readerEstimate > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-accent text-sm">
              <Users className="w-4 h-4" />
              <span className="font-semibold tabular-nums">{formatCount(readerEstimate)}</span>
              <span className="opacity-80">reading {CADENCE_LABEL[readerCadence] ?? "now"}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-4">
        {/* Realm filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setRealmFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
              realmFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 bg-card"
            }`}
          >
            All Realms
          </button>
          {(realms ?? []).map((r) => (
            <button
              key={r._id}
              onClick={() => setRealmFilter(r._id)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
                realmFilter === r._id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 bg-card"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex flex-wrap gap-2 justify-center">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSort(opt)}
              className={`px-3 py-1 rounded-full text-xs border transition-all cursor-pointer ${
                sort === opt
                  ? "bg-accent/15 text-accent border-accent/40"
                  : "border-border text-muted-foreground hover:border-accent/40 bg-card"
              }`}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Book grid */}
      <div className="px-6 pb-24 pt-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LibraryIcon />
              </EmptyMedia>
              <EmptyTitle>No books in this realm yet</EmptyTitle>
              <EmptyDescription>
                Try another realm, or check back soon for new works.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            animate="show"
            key={`${realmFilter}-${sort}`}
          >
            {visible.map((book) => (
              <motion.div key={book._id} variants={fadeUp}>
                <Link to={`/book/${book._id}`} className="group block">
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                    {book.resolvedCoverUrl ? (
                      <img
                        src={book.resolvedCoverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                    {book.isFlagship && (
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px]">
                        Flagship
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="absolute top-3 right-3 text-[10px] bg-card/80 backdrop-blur-sm border-border capitalize"
                    >
                      {book.status}
                    </Badge>

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3
                        className="text-sm font-bold text-foreground leading-snug line-clamp-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {book.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {book.languages.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <ScrollText className="w-3 h-3" />
                          e-Scroll
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

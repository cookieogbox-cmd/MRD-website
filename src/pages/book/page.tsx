import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, Globe, ScrollText, Feather,
  ChevronRight, Lock, Search, SlidersHorizontal, X, ChevronDown, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Authenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { EpisodeUnlockBadge } from "@/components/unlock-gate.tsx";
import { LikeButton } from "@/components/like-button.tsx";

type EpisodeStatus = "free" | "coming" | "locked";

type Episode = {
  number: string;
  title: string;
  subtitle: string;
  synopsis: string;
  cover: string;
  status: EpisodeStatus;
  price?: number;
  minutes: number;
  tags: string[];
  arc: string;
  langCount: number;
};

type SortOption = "default" | "newest" | "oldest" | "az";

const SORT_LABELS: Record<SortOption, string> = {
  default: "Default",
  newest: "Newest First",
  oldest: "Oldest First",
  az: "A → Z",
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function EpisodeCard({ episode, bookId }: { episode: Episode; bookId: Id<"books"> }) {
  const isComing = episode.status === "coming";
  const isLocked = episode.status === "locked";
  const readHref = `/read/${episode.number}?book=${bookId}`;

  return (
    <motion.div variants={fadeUp}>
      <Link
        to={isComing ? "#" : readHref}
        className={`block group h-full ${isComing ? "cursor-default pointer-events-none" : "cursor-pointer"}`}
      >
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full hover:border-primary/40 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
          {/* Cover */}
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            {episode.cover ? (
              <img
                src={episode.cover}
                alt={episode.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ScrollText className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            {isComing && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
            {isLocked && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-xs bg-card/80 backdrop-blur-sm">
                  <Lock className="w-3 h-3 mr-1" /> Locked
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-2 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-semibold text-sm leading-snug text-foreground line-clamp-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {episode.title}
              </h3>
              <Badge
                variant={episode.status === "free" ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0 shrink-0">
                {episode.status === "free" ? "Free" : episode.status === "locked" ? "Paid" : "Soon"}
              </Badge>
            </div>

            <p
              className="text-xs text-muted-foreground line-clamp-3 flex-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.9rem" }}>
              {episode.synopsis}
            </p>

            <div className="flex flex-wrap gap-1 mt-1">
              {episode.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">{tag}</span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1 pt-2 border-t border-border">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{episode.minutes}m</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{episode.langCount} lang</span>
            </div>

            {/* Unlock badge for locked episodes */}
            {isLocked && (
              <Authenticated>
                <EpisodeUnlockBadge episodeNumber={episode.number} />
              </Authenticated>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BookPage() {
  const { chapterId } = useParams<{ chapterId: string }>();

  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedArc, setSelectedArc] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Resolve the book from the URL ref (real id, order number, or legacy "01").
  const book = useQuery(api.books.getByRef, chapterId ? { ref: chapterId } : "skip");
  const dbEpisodes = useQuery(
    api.episodes.listByBook,
    book ? { bookId: book._id } : "skip"
  );

  // Only this book's episodes — never grouped by shared chapter numbers.
  const allEpisodes: Episode[] = (dbEpisodes ?? []).map((e) => ({
    number: e.number,
    title: e.title,
    subtitle: e.subtitle,
    synopsis: e.synopsis,
    cover: e.cover ?? "",
    status: e.status,
    price: e.price,
    minutes: e.minutes,
    tags: e.tags,
    arc: e.arc,
    langCount: e.langCount,
  }));

  const ALL_TAGS = Array.from(new Set(allEpisodes.flatMap((e) => e.tags)));
  const ALL_ARCS = Array.from(new Set(allEpisodes.map((e) => e.arc)));

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setSelectedArc("All");
    setSelectedStatus("All");
    setSort("default");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedTags.length > 0 ||
    selectedArc !== "All" ||
    selectedStatus !== "All" ||
    sort !== "default";

  let filtered = allEpisodes.filter((ep) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      ep.title.toLowerCase().includes(q) ||
      ep.synopsis.toLowerCase().includes(q) ||
      ep.tags.some((t) => t.toLowerCase().includes(q));
    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.every((t) => ep.tags.includes(t));
    const matchArc = selectedArc === "All" || ep.arc === selectedArc;
    const matchStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Available" && ep.status === "free") ||
      (selectedStatus === "Coming Soon" && ep.status === "coming") ||
      (selectedStatus === "Locked" && ep.status === "locked");
    return matchSearch && matchTags && matchArc && matchStatus;
  });

  if (sort === "newest") filtered = [...filtered].reverse();
  if (sort === "oldest") filtered = [...filtered];
  if (sort === "az") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  const loadingBook = book === undefined;
  const loadingEpisodes = book && dbEpisodes === undefined;

  return (
    <div className="min-h-screen text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-md bg-background/70">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Feather className="w-5 h-5 text-primary" />
          <span
            className="text-sm font-bold tracking-widest text-primary uppercase"
            style={{ fontFamily: "'Cinzel Decorative', serif", letterSpacing: "0.12em" }}>
            MRD
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/library" className="hover:text-foreground transition-colors cursor-pointer">Library</Link>
          <Link to="/episodes" className="hover:text-foreground transition-colors cursor-pointer">All Episodes</Link>
        </div>
        <Link to="/library">
          <Button size="sm" className="cursor-pointer">
            Main Library <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </nav>

      {/* Banner */}
      <div className="pt-16 px-0 relative overflow-hidden">
        {loadingBook ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            {book?.resolvedCoverUrl ? (
              <img
                src={book.resolvedCoverUrl}
                alt={book.title}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="relative z-10 h-full max-w-4xl mx-auto flex flex-col items-center justify-end text-center pb-8 px-6">
              <p
                className="text-primary text-xs tracking-widest uppercase mb-2"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {book?.status === "complete" ? "Complete Work" : "Ongoing Series"}
              </p>
              <h1
                className="text-3xl md:text-5xl font-bold mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {book?.title ?? "Book"}
              </h1>
              {book && (
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <LikeButton targetType="book" targetKey={book._id} baseLikes={book.baseLikes ?? 0} showRecent />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Synopsis */}
      {book?.synopsis && (
        <div className="max-w-3xl mx-auto px-6 pt-6">
          <p
            className="text-muted-foreground text-center leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
            {book.synopsis}
          </p>
        </div>
      )}

      {/* Search + controls row */}
      <div className="max-w-xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search episodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer">
              <ChevronDown className="w-3.5 h-3.5" />
              {SORT_LABELS[sort]}
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSort(opt); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        sort === opt
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}>
                      {SORT_LABELS[opt]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-border bg-card/50 mt-6">
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-5">
              {ALL_ARCS.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Series Arc</p>
                  <div className="flex flex-wrap gap-2">
                    {["All", ...ALL_ARCS].map((arc) => (
                      <button
                        key={arc}
                        onClick={() => setSelectedArc(arc)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                          selectedArc === arc
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 bg-background"
                        }`}>
                        {arc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {["All", "Available", "Coming Soon", "Locked"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                        selectedStatus === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 bg-background"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {ALL_TAGS.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 bg-background"
                        }`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="self-start flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" /> Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
          {filtered.length} {filtered.length === 1 ? "episode" : "episodes"}
        </p>
      </div>

      {/* Episode Grid */}
      <div className="px-6 pb-24 max-w-6xl mx-auto">
        {loadingEpisodes ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
            ))}
          </div>
        ) : allEpisodes.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
              <EmptyTitle>No episodes yet</EmptyTitle>
              <EmptyDescription>
                This book doesn{"'"}t have any episodes published yet. Check back soon.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
              No episodes match your filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary hover:underline cursor-pointer">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            animate="show"
            key={`${selectedArc}-${selectedStatus}-${selectedTags.join()}-${sort}`}>
            {book && filtered.map((ep) => (
              <EpisodeCard key={ep.number} episode={ep} bookId={book._id} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

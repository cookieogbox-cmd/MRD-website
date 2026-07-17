import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, Globe, ScrollText, BookOpen, ChevronRight, Feather,
  Lock, Search, SlidersHorizontal, X, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Link, useSearchParams } from "react-router-dom";
import { Authenticated } from "convex/react";
import { EpisodeUnlockBadge } from "@/components/unlock-gate.tsx";
import { LikeButton, ReaderCount } from "@/components/like-button.tsx";

// ── Types ────────────────────────────────────────────────────────────────────
type EpisodeStatus = "free" | "coming" | "locked";

type Episode = {
  number: string;
  title: string;
  episodeLabel?: string;
  subtitle: string;
  synopsis: string;
  cover: string;
  status: EpisodeStatus;
  price?: number;
  tokenPrice?: number;
  minutes: number;
  tags: string[];
  arc: string;
  langCount: number;
  chapterGroup?: string; // links to chapters DB number e.g. "01"
  baseLikes?: number;
  baseReaders?: number;
  readerCadence?: string;
};

// ── Data ─────────────────────────────────────────────────────────────────────
const EPISODES: Episode[] = [
  {
    number: "01",
    title: "Episode 1",
    subtitle: "Scar-heart Malka Raurah · Episode 1",
    synopsis:
      "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
    cover: "https://hercules-cdn.com/file_zwKoMroNRzrAPhnO04OOvFqt",
    status: "free",
    minutes: 44,
    tags: ["Magic", "Memory", "Origin"],
    arc: "Arc I — The Forgetting",
    langCount: 18,
    chapterGroup: "01",
  },
  {
    number: "02",
    title: "Episode 2",
    subtitle: "Scar-heart Malka Raurah · Episode 2",
    synopsis:
      "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
    cover: "https://hercules-cdn.com/file_Pjj1jCqzVtK2EmJFhyuBbOP0",
    status: "free",
    minutes: 44,
    tags: ["Magic", "Memory", "Origin"],
    arc: "Arc I — The Forgetting",
    langCount: 1,
    chapterGroup: "01",
  },
  {
    number: "ep03",
    title: "Episode 3",
    subtitle: "Scar-heart Malka Raurah · Episode 3",
    synopsis:
      "Beyond the city walls stands a gate no one has passed in a century. Malka has a key she doesn't remember acquiring — and something ancient is already waiting on the other side.",
    cover: "https://hercules-cdn.com/file_dsbSxaNfIx3OB5B7MWMKLiir",
    status: "coming",
    minutes: 44,
    tags: ["Magic", "Mystery", "Threshold"],
    arc: "Arc I — The Forgetting",
    langCount: 18,
    chapterGroup: "01",
  },
  {
    number: "ep04",
    title: "Episode 4",
    subtitle: "Scar-heart Malka Raurah · Episode 4",
    synopsis:
      "The memory-keepers have declared war on the scarred. Malka must choose: vanish into safety or ignite the rebellion the city has been holding its breath for.",
    cover: "https://hercules-cdn.com/file_hImXFPvfKor1NUph1wJ7x1vM",
    status: "coming",
    minutes: 44,
    tags: ["Rebellion", "War", "Choice"],
    arc: "Arc I — The Forgetting",
    langCount: 18,
    chapterGroup: "01",
  },
];

const ALL_TAGS = Array.from(new Set(EPISODES.flatMap((e) => e.tags)));
const ALL_ARCS = Array.from(new Set(EPISODES.map((e) => e.arc)));

type SortOption = "default" | "newest" | "oldest" | "az";

const SORT_LABELS: Record<SortOption, string> = {
  default: "Default",
  newest: "Newest First",
  oldest: "Oldest First",
  az: "A → Z",
};

// ── Animations ───────────────────────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EpisodesPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedArc, setSelectedArc] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);

  // Pre-filter by ?chapter= param from URL
  useEffect(() => {
    const ch = searchParams.get("chapter");
    setChapterFilter(ch);
  }, [searchParams]);

  const dbChapters = useQuery(api.chapters.list, {});
  void dbChapters; // used only for homepage book cards, not episode list

  const dbEpisodes = useQuery(api.episodes.list, {});
  const seedEpisodes = useMutation(api.episodes.seedDefaults);
  const ensureFoundation = useMutation(api.migrations.ensureFoundation);

  useEffect(() => {
    // Seed default episodes, then backfill bookId via the foundation migration.
    seedEpisodes()
      .then(() => ensureFoundation())
      .catch(() => {/* ignore if already seeded/migrated */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use DB episodes if loaded, otherwise fall back to static list
  const episodes: Episode[] = (dbEpisodes && dbEpisodes.length > 0)
    ? dbEpisodes.map((e) => ({
        number: e.number,
        title: e.title,
        subtitle: e.subtitle,
        synopsis: e.synopsis,
        cover: e.cover ?? "",
        status: e.status,
        price: e.price,
        tokenPrice: e.tokenPrice,
        minutes: e.minutes,
        tags: e.tags,
        arc: e.arc,
        langCount: e.langCount,
        chapterGroup: e.chapterGroup,
        baseLikes: e.baseLikes,
        baseReaders: e.baseReaders,
        readerCadence: e.readerCadence,
      }))
    : EPISODES;

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

  let filtered = episodes.filter((ep) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      ep.title.toLowerCase().includes(q) ||
      ep.synopsis.toLowerCase().includes(q) ||
      ep.tags.some((t) => t.toLowerCase().includes(q));
    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.every((t) => ep.tags.includes(t));
    const matchChapter = !chapterFilter || ep.chapterGroup === chapterFilter || ep.number === chapterFilter;
    const matchArc = selectedArc === "All" || ep.arc === selectedArc;
    const matchStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Available" && ep.status === "free") ||
      (selectedStatus === "Coming Soon" && ep.status === "coming") ||
      (selectedStatus === "Locked" && ep.status === "locked");
    return matchSearch && matchTags && matchArc && matchStatus && matchChapter;
  });

  if (sort === "newest") filtered = [...filtered].reverse();
  if (sort === "oldest") filtered = [...filtered];
  if (sort === "az") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="pt-10 pb-10 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <p
            className="text-primary text-xs tracking-widest uppercase mb-3"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Episodes
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Scar-heart Malka Raurah
          </h1>
          <p
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Browse every episode. Each installment is a complete 44-minute journey —
            available in 18 languages.
          </p>

          {/* Search + controls row */}
          <div className="mt-8 flex items-center gap-3 max-w-xl mx-auto">
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
        </motion.div>
      </div>

      {/* Advanced filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-border bg-card/50">
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-5">

              {/* Series Arc */}
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

              {/* Status */}
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

              {/* Tags */}
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

              {/* Clear */}
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

      {/* Active filter chips */}
      {(selectedTags.length > 0 || selectedArc !== "All" || selectedStatus !== "All") && (
        <div className="max-w-6xl mx-auto px-6 pt-4 flex flex-wrap gap-2">
          {selectedArc !== "All" && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
              {selectedArc}
              <button onClick={() => setSelectedArc("All")} className="cursor-pointer hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedStatus !== "All" && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
              {selectedStatus}
              <button onClick={() => setSelectedStatus("All")} className="cursor-pointer hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
              {tag}
              <button onClick={() => toggleTag(tag)} className="cursor-pointer hover:opacity-70"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
          {filtered.length === EPISODES.length
            ? `${EPISODES.length} episodes`
            : `${filtered.length} of ${EPISODES.length} episodes`}
        </p>
      </div>

      {/* Episode Grid */}
      <div className="px-6 pb-24 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
              No episodes match your filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-primary hover:underline cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            animate="show"
            key={`${selectedArc}-${selectedStatus}-${selectedTags.join()}-${sort}`}>
            {filtered.map((ep) => (
              <EpisodeCard key={ep.number} episode={ep} />
            ))}
          </motion.div>
        )}

        {/* Series info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Feather className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              More Episodes Coming
            </h3>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
              Scar-heart Malka Raurah is an ongoing series. New episodes drop regularly —
              each one crafted for exactly 44 minutes of immersive reading in 18 languages.
            </p>
          </div>
          <Link to="/read/01">
            <Button className="cursor-pointer flex-shrink-0">
              <BookOpen className="w-4 h-4 mr-2" /> Start with Episode 1
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── Episode Card ─────────────────────────────────────────────────────────────
function EpisodeCard({ episode }: { episode: Episode }) {
  const isLocked = episode.status === "locked";
  const isComing = episode.status === "coming";

  return (
    <motion.div
      variants={fadeUp}
      className={`group bg-card border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isLocked || isComing
          ? "border-border opacity-70"
          : "border-border hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
      }`}>

      {/* Cover */}
      <Link to={`/episodes/${episode.number}`} className="block">
        <div className="relative overflow-hidden">
          <img
            src={episode.cover}
            alt={episode.title}
            className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <div
            className="absolute top-3 left-3 text-primary/60 text-xl font-bold"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            {episode.number}
          </div>
          <div className="absolute top-3 right-3">
            {episode.status === "free" && (
              <Badge className="bg-primary text-primary-foreground text-xs">Free</Badge>
            )}
            {episode.status === "coming" && (
              <Badge variant="outline" className="border-border text-muted-foreground text-xs bg-card/80 backdrop-blur-sm">
                Coming Soon
              </Badge>
            )}
            {isLocked && (
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )}
          </div>
          {/* Arc label */}
          <div className="absolute bottom-2 left-2 right-2">
            <span className="text-[10px] text-muted-foreground/70 tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {episode.arc}
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3
            className="font-bold text-foreground text-base leading-snug mb-0.5"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {episode.subtitle}
          </h3>
          <p
            className="text-muted-foreground text-xs line-clamp-3 leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
            {episode.synopsis}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {episode.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" /> {episode.minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-accent" /> {episode.langCount} langs
          </span>
          <span className="flex items-center gap-1">
            <ScrollText className="w-3 h-3" /> e-Scroll
          </span>
        </div>

        {/* Likes & readers */}
        <div className="flex flex-wrap items-center gap-2">
          <LikeButton
            targetType="episode"
            targetKey={episode.number}
            baseLikes={episode.baseLikes ?? 0}
            size="sm"
          />
          {(episode.baseReaders ?? 0) > 0 && (
            <ReaderCount
              count={episode.baseReaders ?? 0}
              cadence={episode.readerCadence ?? "daily"}
              size="sm"
            />
          )}
        </div>

        {/* CTA */}
        {episode.status === "free" ? (
          <Link to={`/read/${episode.number}`} className="w-full">
            <Button size="sm" className="w-full cursor-pointer mt-1">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Read Now
            </Button>
          </Link>
        ) : isLocked ? (
          <div className="w-full mt-1 space-y-2">
            <Authenticated>
              <EpisodeUnlockBadge episodeNumber={episode.number} />
            </Authenticated>
            <Link to={`/read/${episode.number}`} className="w-full block">
              <Button size="sm" className="w-full cursor-pointer" variant="secondary">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> {episode.tokenPrice ? `Unlock — ${episode.tokenPrice} tokens` : episode.price ? `Unlock — ${episode.price} tokens` : "Unlock Episode"}
              </Button>
            </Link>
          </div>
        ) : (
          <Button size="sm" className="w-full cursor-pointer mt-1" variant="secondary" disabled>
            Coming Soon
          </Button>
        )}
      </div>
    </motion.div>
  );
}

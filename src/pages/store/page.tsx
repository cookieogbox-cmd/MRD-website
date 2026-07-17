import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Clock, Globe, ScrollText, Search, Filter, X, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type SortOption = "default" | "newest" | "oldest" | "az" | "free-first";
const SORT_OPTIONS: Record<SortOption, string> = {
  default: "Default",
  newest: "Newest",
  oldest: "Oldest",
  az: "A to Z",
  "free-first": "Free First",
};

export default function StorePage() {
  const episodes = useQuery(api.episodes.list, {});
  const chapters = useQuery(api.chapters.list, {});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("default");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeries, setFilterSeries] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Build filtered and sorted list
  const filtered = (episodes ?? []).filter((ep) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" ||
      ep.title.toLowerCase().includes(q) ||
      ep.subtitle.toLowerCase().includes(q) ||
      ep.tags.some((t) => t.toLowerCase().includes(q));
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "free" && ep.status === "free") ||
      (filterStatus === "locked" && ep.status === "locked") ||
      (filterStatus === "coming" && ep.status === "coming");
    const matchSeries = filterSeries === "all" || ep.chapterGroup === filterSeries;
    return matchSearch && matchStatus && matchSeries;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return b.order - a.order;
    if (sort === "oldest") return a.order - b.order;
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "free-first") {
      if (a.status === "free" && b.status !== "free") return -1;
      if (b.status === "free" && a.status !== "free") return 1;
      return a.order - b.order;
    }
    return a.order - b.order;
  });

  const hasFilters = search !== "" || filterStatus !== "all" || filterSeries !== "all" || sort !== "default";

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="pt-8 pb-4 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Floating Library
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Browse all e-Scrolls. Sort by genre, series, availability, language, and more.
          </p>
        </motion.div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-6 max-w-5xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 cursor-pointer"
            >
              <Filter className="w-4 h-4" /> Filters
            </Button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background cursor-pointer"
            >
              {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 border border-border rounded-xl bg-card/50 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {["all", "free", "locked", "coming"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                            filterStatus === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {s === "all" ? "All" : s === "free" ? "Free" : s === "locked" ? "Paid" : "Coming Soon"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {chapters && chapters.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Series</label>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setFilterSeries("all")}
                          className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                            filterSeries === "all"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          All
                        </button>
                        {chapters.map((ch) => (
                          <button
                            key={ch.number}
                            onClick={() => setFilterSeries(ch.number)}
                            className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                              filterSeries === ch.number
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {ch.seriesColor || ch.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {hasFilters && (
                  <button
                    onClick={() => { setSearch(""); setFilterStatus("all"); setFilterSeries("all"); setSort("default"); }}
                    className="text-xs text-primary cursor-pointer hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <div className="px-6 max-w-5xl mx-auto mb-4">
        <p className="text-sm text-muted-foreground">
          {sorted.length} scroll{sorted.length !== 1 ? "s" : ""}
          {hasFilters && " (filtered)"}
        </p>
      </div>

      {/* Library Grid */}
      {episodes === undefined ? (
        <div className="px-6 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No scrolls match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <motion.div
          className="px-6 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {sorted.map((ep) => (
            <motion.div
              key={ep._id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
              <Link
                to={ep.status === "free" ? `/read/${ep.number}` : `/episodes/${ep.number}`}
                className="block group"
              >
                <div className="rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all">
                  {/* Cover */}
                  <div className="relative h-48 overflow-hidden">
                    {ep.cover ? (
                      <img src={ep.cover} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={ep.status === "free" ? "default" : "secondary"}>
                        {ep.status === "free" ? "Free" : ep.status === "coming" ? "Coming Soon" : "Locked"}
                      </Badge>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{ep.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ep.synopsis}</p>
                    <div className="flex flex-wrap gap-1">
                      {ep.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ep.minutes}m</span>
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{ep.langCount} langs</span>
                      <span className="flex items-center gap-1"><ScrollText className="w-3 h-3" />e-Scroll</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

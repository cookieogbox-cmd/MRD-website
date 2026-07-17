import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Clock, Globe, ScrollText, ChevronLeft, ChevronRight,
  Feather, Lock, BookOpen, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";

// Shared episode data type & list (mirrored from episodes page)
type EpisodeStatus = "free" | "coming" | "locked";

type Episode = {
  number: string;
  title: string;
  subtitle: string;
  synopsis: string;
  cover: string;
  status: EpisodeStatus;
  minutes: number;
  tags: string[];
  seriesArc?: string;
  releaseDate?: string;
  languages?: string[];
};

const LANGUAGES_18 = [
  "English (With Subtitles)", "English (No Subtitles)", "Français", "Español",
  "Deutsch", "日本語", "한국어", "中文", "العربية", "Português",
  "Italiano", "Русский", "हिन्दी", "Swahili", "Bahasa", "Türkçe",
  "Polski", "Čeština",
];

const EPISODES: Episode[] = [
  {
    number: "01",
    title: "Chapter 1",
    subtitle: "Scar-heart Malka Raurah · Chapter 1",
    synopsis:
      "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
    cover: "https://hercules-cdn.com/file_zwKoMroNRzrAPhnO04OOvFqt",
    status: "free",
    minutes: 44,
    tags: ["Magic", "Memory", "Origin"],
    seriesArc: "Arc I — The Forgetting",
    releaseDate: "Season 1",
    languages: LANGUAGES_18,
  },
  {
    number: "02",
    title: "Chapter 1",
    subtitle: "Scar-heart Malka Raurah · Chapter 1",
    synopsis:
      "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
    cover: "https://hercules-cdn.com/file_Pjj1jCqzVtK2EmJFhyuBbOP0",
    status: "free",
    minutes: 44,
    tags: ["Magic", "Memory", "Origin"],
    seriesArc: "Arc I — The Forgetting",
    releaseDate: "Season 1",
    languages: ["English"],
  },
  {
    number: "03",
    title: "Chapter 3",
    subtitle: "Scar-heart Malka Raurah",
    synopsis:
      "Beyond the city walls stands a gate no one has passed in a century. Malka has a key she doesn't remember acquiring — and something ancient is already waiting on the other side.",
    cover: "https://hercules-cdn.com/file_dsbSxaNfIx3OB5B7MWMKLiir",
    status: "coming",
    minutes: 44,
    tags: ["Magic", "Mystery", "Threshold"],
    seriesArc: "Arc II — The Gate",
    releaseDate: "Coming Soon",
    languages: LANGUAGES_18,
  },
  {
    number: "04",
    title: "Chapter 4",
    subtitle: "Scar-heart Malka Raurah",
    synopsis:
      "The memory-keepers have declared war on the scarred. Malka must choose: vanish into safety or ignite the rebellion the city has been holding its breath for.",
    cover: "https://hercules-cdn.com/file_hImXFPvfKor1NUph1wJ7x1vM",
    status: "coming",
    minutes: 44,
    tags: ["Rebellion", "War", "Choice"],
    seriesArc: "Arc II — The Gate",
    releaseDate: "Coming Soon",
    languages: LANGUAGES_18,
  },
];

export default function EpisodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const episode = EPISODES.find((e) => e.number === id);

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Episode not found.</p>
          <Link to="/episodes">
            <Button variant="secondary">Back to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = EPISODES.findIndex((e) => e.number === id);
  const prevEp = EPISODES[currentIdx - 1];
  const nextEp = EPISODES[currentIdx + 1];

  const canRead = episode.status === "free";

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ fontFamily: "'Cormorant Garamond', serif" }}>

      {/* Back nav */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <Link
          to="/episodes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-64 flex-shrink-0">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={episode.cover}
                alt={episode.title}
                className="w-full h-auto block"
              />
              {episode.status === "coming" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span
                    className="text-white text-sm font-bold tracking-widest uppercase border border-white/30 px-3 py-1.5 rounded-full"
                    style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="flex-1 min-w-0">

            {/* Episode number badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest text-primary uppercase"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                Episode {episode.number}
              </span>
              {episode.status === "free" && (
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Free</Badge>
              )}
              {episode.status === "locked" && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </Badge>
              )}
            </div>

            <h1
              className="text-3xl md:text-5xl font-bold text-foreground mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {episode.title}
            </h1>
            <p className="text-base text-muted-foreground mb-5">{episode.subtitle}</p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                {episode.minutes} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-accent" />
                {episode.languages?.length ?? 18} languages
              </span>
              <span className="flex items-center gap-1.5">
                <Feather className="w-4 h-4" />
                e-Scroll
              </span>
              {episode.seriesArc && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {episode.seriesArc}
                </span>
              )}
              {episode.releaseDate && (
                <span className="flex items-center gap-1.5">
                  <ScrollText className="w-4 h-4" />
                  {episode.releaseDate}
                </span>
              )}
            </div>

            {/* Synopsis */}
            <p
              className="text-base md:text-lg text-foreground/80 leading-relaxed mb-6 max-w-xl"
              style={{ fontSize: "1.1rem", lineHeight: "1.75" }}>
              {episode.synopsis}
            </p>

            {/* Tags */}
            {episode.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-7">
                {episode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase text-muted-foreground border border-border rounded-full px-3 py-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            {canRead ? (
              <Link to={`/read/${episode.number}`}>
                <Button size="lg" className="cursor-pointer gap-2">
                  <BookOpen className="w-4 h-4" /> Read Now
                </Button>
              </Link>
            ) : (
              <Button size="lg" disabled className="gap-2 opacity-60">
                <Lock className="w-4 h-4" /> Coming Soon
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Language availability */}
      {episode.languages && episode.languages.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-8 border-t border-border">
          <h2
            className="text-lg font-bold text-foreground mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Available Languages
          </h2>
          <div className="flex flex-wrap gap-2">
            {episode.languages.map((lang) => (
              <span
                key={lang}
                className="text-xs font-medium bg-card border border-border rounded-full px-3 py-1 text-muted-foreground">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="max-w-5xl mx-auto px-4 py-8 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          {prevEp ? (
            <Link
              to={`/episodes/${prevEp.number}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <div>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">Previous</p>
                <p className="font-semibold text-foreground">{prevEp.title}</p>
              </div>
            </Link>
          ) : <div />}

          <Link to="/episodes">
            <Button variant="secondary" size="sm" className="cursor-pointer">
              All Episodes
            </Button>
          </Link>

          {nextEp ? (
            <Link
              to={`/episodes/${nextEp.number}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group text-right">
              <div>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">Next</p>
                <p className="font-semibold text-foreground">{nextEp.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}

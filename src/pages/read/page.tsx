import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, Globe, BookOpen, X, ChevronDown,
  Clock, Feather, Bookmark, BookmarkCheck, User, LogIn } from
"lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api.js";
import { EPISODE_1 } from "./_data/episode-1.ts";
import { EPISODE_2 } from "./_data/episode-2.ts";
import type { Section } from "./_data/episode-1.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import CommentSection from "@/components/comment-section.tsx";
import UnlockGate from "@/components/unlock-gate.tsx";

const FALLBACK_LANG = "English (With Subtitles)";
const SAVE_INTERVAL_MS = 15_000; // save progress every 15s

function getChapters(sections: Section[]) {
  return sections.filter((s) => s.type === "chapter");
}

export default function ReadPage() {
  return (
    <>
      <Authenticated>
        <ReadPageInner />
      </Authenticated>
      <Unauthenticated>
        <ReadPageInner />
      </Unauthenticated>
    </>);

}

function ReadPageInner() {
  const [language, setLanguage] = useState(FALLBACK_LANG);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [minutesRead, setMinutesRead] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
  const lastScrollY = useRef(0);
  const readTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollProgressRef = useRef(0);

  const { episodeNumber } = useParams<{episodeNumber: string;}>();
  const [searchParams] = useSearchParams();
  const bookRef = searchParams.get("book");

  // Resolve which book we're reading. Lets us scope content per book and
  // decide whether the hard-coded flagship story may be used as a fallback.
  const book = useQuery(api.books.getByRef, bookRef ? { ref: bookRef } : "skip");
  const flagship = useQuery(api.books.getFlagship, {});

  // The hard-coded story only belongs to the flagship book. For any other book
  // we must never fall back to it — we show only that book's uploaded pages.
  const isFlagshipContext =
    !bookRef || (book && flagship && book._id === flagship._id);

  const episode = episodeNumber === "02" ? EPISODE_2 : EPISODE_1;

  // Scroll to top when episode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [episodeNumber]);

  const staticSections: Section[] =
  isFlagshipContext ? (episode.sections[language] ?? []) : [];

  // Convex hooks
  const savedProgress = useQuery(api.reading.getProgress, { episodeNumber: episode.number });
  const bookmarks = useQuery(api.reading.getBookmarks, { episodeNumber: episode.number });
  // Book-scoped pages keep each book's content separate; fall back to the
  // legacy per-episode query only in the flagship context.
  const dbPagesByBook = useQuery(
    api.episodePages.listPagesByBook,
    book ? { bookId: book._id, episodeNumber: episode.number, language } : "skip"
  );
  const dbPagesLegacy = useQuery(
    api.episodePages.listPages,
    isFlagshipContext ? { episodeNumber: episode.number, language } : "skip"
  );
  const dbPages = book ? dbPagesByBook : dbPagesLegacy;
  const saveProgressMutation = useMutation(api.reading.saveProgress);
  const addBookmarkMutation = useMutation(api.reading.addBookmark);
  const removeBookmarkMutation = useMutation(api.reading.removeBookmark);

  // If DB pages exist for this episode+language, use them instead of static data
  const sections: Section[] = dbPages && dbPages.length > 0 ?
  dbPages.
  slice().
  sort((a, b) => a.order - b.order).
  map((p, i) => ({
    id: `db-p${i + 1}`,
    type: "image" as const,
    imageUrl: p.url ?? ""
  })) :
  staticSections;
  const chapters = getChapters(sections);

  // Restore scroll position from saved progress on first load
  const [restoredScroll, setRestoredScroll] = useState(false);
  useEffect(() => {
    if (savedProgress && !restoredScroll && scrollRef.current) {
      const el = scrollRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll > 0 && savedProgress.progressPercent > 0) {
        el.scrollTo({ top: maxScroll * (savedProgress.progressPercent / 100) });
      }
      if (savedProgress.language) setLanguage(savedProgress.language);
      setRestoredScroll(true);
    }
  }, [savedProgress, restoredScroll]);

  // Track reading time
  useEffect(() => {
    readTimerRef.current = setInterval(() => {
      setMinutesRead((m) => Math.min(m + 1, episode.minutesTotal));
    }, 60_000);
    return () => {if (readTimerRef.current) clearInterval(readTimerRef.current);};
  }, [episode.minutesTotal]);

  // Periodic progress saving
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const pct = Math.round(scrollProgressRef.current * 100);
      saveProgressMutation({
        episodeNumber: episode.number,
        progressPercent: pct,
        language,
        completed: pct >= 95
      }).catch(() => {/* not signed in, ignore */});
    }, SAVE_INTERVAL_MS);
    return () => {if (saveTimerRef.current) clearInterval(saveTimerRef.current);};
  }, [episode.number, language, saveProgressMutation]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    const pct = maxScroll > 0 ? scrollTop / maxScroll : 0;
    setScrollProgress(pct);
    scrollProgressRef.current = pct;

    const delta = scrollTop - lastScrollY.current;
    if (delta > 8) setHeaderVisible(false);else
    if (delta < -8) setHeaderVisible(true);
    lastScrollY.current = scrollTop;

    let current = chapters[0]?.id ?? "";
    for (const ch of chapters) {
      const chEl = chapterRefs.current[ch.id];
      if (chEl && chEl.getBoundingClientRect().top < 160) current = ch.id;
    }
    setActiveChapter(current);
  }, [chapters]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToChapter = (id: string) => {
    chapterRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  const progressPercent = Math.round(scrollProgress * 100);
  const estimatedMinutesLeft = Math.round(episode.minutesTotal * (1 - scrollProgress));

  const handleBookmark = async () => {
    const activeSection = sections.find((s) => s.id === activeChapter);
    if (!activeSection) return;
    try {
      await addBookmarkMutation({
        episodeNumber: episode.number,
        sectionId: activeChapter,
        sectionLabel: activeSection.label ?? activeSection.content?.slice(0, 40) ?? "Bookmark",
        progressPercent
      });
      toast.success("Bookmark saved");
    } catch {
      toast.error("Sign in to save bookmarks");
    }
  };

  const isBookmarked = bookmarks?.some((b) => b.sectionId === activeChapter) ?? false;
  const currentBookmark = bookmarks?.find((b) => b.sectionId === activeChapter);

  // Display values: use the book's own title/cover/series for non-flagship
  // books, falling back to the hard-coded flagship episode data otherwise.
  const displaySeries = isFlagshipContext ? episode.series : (book?.title ?? episode.series);
  const displayCover = isFlagshipContext ? episode.coverUrl : (book?.resolvedCoverUrl ?? episode.coverUrl);

  return (
    <div className="h-screen flex flex-col text-foreground overflow-hidden">
      {/* ── Progress bar ──────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-border/40">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.1 }} />
        
      </div>

      {/* ── Reading Header ──────────────────────────── */}
      <AnimatePresence>
        {headerVisible &&
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0.5 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 border-b border-border/40 backdrop-blur-md bg-background/80">
          
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/episodes">
                <Button variant="ghost" size="sm" className="cursor-pointer text-muted-foreground hover:text-foreground flex-shrink-0 px-2">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Episodes
                </Button>
              </Link>
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground text-xs">|</span>
                <span className="text-xs text-muted-foreground truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {episode.series}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-foreground font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ep. {episode.number} — {episode.title}
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>~{estimatedMinutesLeft} min left</span>
              </div>

              <div className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {progressPercent}%
              </div>

              {/* Bookmark button */}
              <Authenticated>
                <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer px-2"
                onClick={async () => {
                  if (isBookmarked && currentBookmark) {
                    await removeBookmarkMutation({ bookmarkId: currentBookmark._id as Id<"bookmarks"> });
                    toast.success("Bookmark removed");
                  } else {
                    await handleBookmark();
                  }
                }}
                title={isBookmarked ? "Remove bookmark" : "Bookmark this section"}>
                
                  {isBookmarked ?
                <BookmarkCheck className="w-4 h-4 text-primary" /> :
                <Bookmark className="w-4 h-4" />
                }
                </Button>
              </Authenticated>
              <Unauthenticated>
                <Button variant="ghost" size="sm" className="cursor-pointer px-2" onClick={handleBookmark} title="Sign in to bookmark">
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Unauthenticated>

              {/* Language switcher */}
              <div className="relative">
                <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-xs gap-1.5 px-2"
                onClick={() => setLangMenuOpen((v) => !v)}>
                
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <span className="hidden sm:inline">{language}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <AnimatePresence>
                  {langMenuOpen &&
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  
                      <div className="p-2 max-h-64 overflow-y-auto">
                        {episode.languages.map((lang) =>
                    <button
                      key={lang}
                      onClick={() => {setLanguage(lang);setLangMenuOpen(false);scrollRef.current?.scrollTo({ top: 0 });}}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-between ${lang === language ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
                      
                            {lang}
                            {!episode.sections[lang] && <span className="text-xs opacity-50">Soon</span>}
                          </button>
                    )}
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>

              {/* TOC / History / Auth */}
              <Button variant="ghost" size="sm" className="cursor-pointer px-2" onClick={() => setTocOpen((v) => !v)}>
                <BookOpen className="w-4 h-4" />
              </Button>

              <Authenticated>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="cursor-pointer px-2" title="Reading history">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
              </Authenticated>
              <Unauthenticated>
                <SignInButton className="h-8 px-3 text-xs" />
              </Unauthenticated>
            </div>
          </motion.header>
        }
      </AnimatePresence>

      {/* ── TOC Drawer ──────────────────────────────── */}
      <AnimatePresence>
        {tocOpen &&
        <>
            <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-background/60 backdrop-blur-sm"
            onClick={() => setTocOpen(false)} />
          
            <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[56] w-72 bg-card border-l border-border flex flex-col">
            
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Table of Contents
                </h3>
                <button onClick={() => setTocOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Episode info */}
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <img src={episode.coverUrl} alt={episode.title} className="w-10 h-14 rounded object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {episode.series}
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Ep. {episode.number} — {episode.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {progressPercent}% complete · {minutesRead} min read
                  </p>
                </div>
              </div>

              {/* Chapters */}
              <nav className="flex-1 overflow-y-auto p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">Chapters</p>
                {chapters.map((ch) =>
              <button
                key={ch.id}
                onClick={() => scrollToChapter(ch.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer mb-1 ${activeChapter === ch.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
                
                    {ch.label}
                  </button>
              )}

                {/* Bookmarks */}
                {bookmarks && bookmarks.length > 0 &&
              <>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mt-5 mb-2">Bookmarks</p>
                    {bookmarks.map((bm) =>
                <div key={bm._id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted group mb-1">
                        <BookmarkCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span
                    className="flex-1 truncate cursor-pointer hover:text-foreground"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}
                    onClick={() => scrollToChapter(bm.sectionId)}>
                    
                          {bm.sectionLabel}
                        </span>
                        <button
                    className="opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={() => removeBookmarkMutation({ bookmarkId: bm._id as Id<"bookmarks"> })}>
                    
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                )}
                  </>
              }

                {/* Sign-in prompt in TOC */}
                <Unauthenticated>
                  <div className="mt-6 mx-2 p-4 rounded-xl border border-border bg-background text-center">
                    <LogIn className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
                      Sign in to save your progress and bookmarks
                    </p>
                    <SignInButton className="w-full h-8 text-xs" />
                  </div>
                </Unauthenticated>
              </nav>
            </motion.aside>
          </>
        }
      </AnimatePresence>

      {/* ── Scroll Content ──────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-14"
        onClick={() => {if (langMenuOpen) setLangMenuOpen(false);}}>
        
        {/* Cover / Episode Hero */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden flex items-end">
          <img src={episode.coverUrl} alt={episode.title} className="absolute inset-0 w-full h-full object-cover object-top opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative z-10 px-6 md:px-0 md:max-w-2xl md:mx-auto w-full pb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <p className="text-primary/70 text-xs tracking-widest uppercase mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                {episode.series}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                {episode.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {episode.minutesTotal} minutes</span>
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-accent" /> {language}</span>
                <span className="flex items-center gap-1.5"><Feather className="w-3.5 h-3.5" /> e-Scroll</span>
              </div>

              {/* Next Instructions dropdown removed from here - moved below hero */}

            </motion.div>
          </div>
        </div>

        {/* Next Instructions dropdown - below hero so it expands freely */}
        <div className="max-w-2xl mx-auto px-4 pt-2"><InstructionsDropdown /></div>

        {/* Token-gated content: everything below hero is locked if episode requires tokens */}
        <UnlockGate episodeNumber={episode.number} episodeTitle={`Ep. ${episode.number} — ${episode.title}`}>
          {/* Saved progress resume banner */}
          {savedProgress && savedProgress.progressPercent > 5 && !restoredScroll &&
          <div className="max-w-2xl mx-auto px-6 pt-4">
              <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-xl px-4 py-3 text-sm">
                <BookmarkCheck className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground flex-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
                  You were at {savedProgress.progressPercent}% in {savedProgress.language}
                </span>
                <button className="text-primary text-xs font-semibold cursor-pointer hover:underline">
                  Resume
                </button>
              </div>
            </div>
          }

          {/* Section tabs for English versions */}
          {(language === "English (With Subtitles)" || language === "English (No Subtitles)" || language === "English") &&
          <div className="max-w-2xl mx-auto px-4 pt-6">
              <div className="flex rounded-xl border border-border overflow-hidden bg-card">
                <button
                onClick={() => {setLanguage("English (With Subtitles)");scrollRef.current?.scrollTo({ top: 0 });}}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${language !== "English (No Subtitles)" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                style={{ fontFamily: "'Playfair Display', serif" }}>
                  📖 With Subtitles
                </button>
                <button
                onClick={() => {setLanguage("English (No Subtitles)");scrollRef.current?.scrollTo({ top: 0 });}}
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer border-l border-border ${language === "English (No Subtitles)" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                style={{ fontFamily: "'Playfair Display', serif" }}>
                  ✨ No Subtitles
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2 mb-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {language !== "English (No Subtitles)" ? "Reading with word definitions in [brackets]" : "Premium edition — pure uninterrupted reading"}
              </p>
            </div>
          }

          {/* Reading body */}
          <div className="max-w-2xl mx-auto px-4 pb-16 pt-4">
            {sections.length === 0 && dbPages !== undefined ?
            <div className="text-center py-24 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-semibold text-foreground">No pages available yet</p>
                <p className="text-sm mt-2">This language version hasn{"'"}t been published yet. Check back soon or try another language.</p>
              </div> :

            sections.map((section) =>
            <SectionBlock
              key={section.id}
              section={section}
              ref={(el) => {
                if (section.type === "chapter") {
                  chapterRefs.current[section.id] = el;
                }
              }} />
            )
            }
          </div>

          {/* Scarheart Gossipers comment section */}
          <div id="scarheart-comments" className="max-w-2xl mx-auto px-4 pb-24">
            <CommentSection
              group="scarheart"
              title="Scarheart Gossipers"
              description="Share your theories, reactions, and heartfelt thoughts about this episode." />
            
          </div>
        </UnlockGate>










































































































        
      </div>
    </div>);

}

// Instructions dropdown component
function InstructionsDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors rounded-xl px-4 py-2.5 cursor-pointer w-full md:w-auto"
        style={{ fontFamily: "'Cinzel Decorative', serif" }}>
        <span className="text-sm font-bold text-primary tracking-wide">PEacockbook:Unroll-me-first!    </span>
        <ChevronDown className={`w-4 h-4 text-primary flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden mt-2">
            <div className="rounded-xl border border-primary/20 overflow-hidden flex flex-col">
              {[
            "https://hercules-cdn.com/file_4dn413e7yWUQNQNBkIrR1tMu",
            "https://hercules-cdn.com/file_ReITjcJgmzARuIIYtTBn32zB",
            "https://hercules-cdn.com/file_v2W01ZXTyzbaU5f6PvnzBGpw",
            "https://hercules-cdn.com/file_pVnCLiIPAVRoziVIgwysr5t5",
            "https://hercules-cdn.com/file_fKE0BgH3XRlXIl7zhgK3t58D",
            "https://hercules-cdn.com/file_jBy6qGZMr6o4Y7YsqD3CegbV",
            "https://hercules-cdn.com/file_HvCLakiSgRls8LImlAs6Jm7w",
            "https://hercules-cdn.com/file_acpWZY7NilDift0Xg7EoFPhT",
            "https://hercules-cdn.com/file_tB94TlXUkVDY0KlBOb5rThvz",
            "https://hercules-cdn.com/file_zN1bk0I11zGTRazx6rtBl0Jo",
            "https://hercules-cdn.com/file_T05hka4NGDLpTwplvO4ZVIP0",
            "https://hercules-cdn.com/file_XH8BoaUVt2OqYHqDNKO7RU87",
            "https://hercules-cdn.com/file_EyPJvE5nhzl53fAz4CHjd6Mb",
            "https://hercules-cdn.com/file_S8fCzbvYj9odp4MAp1Bnm5ua"].
            map((url, i) =>
            <img key={i} src={url} alt={`Instructions page ${i + 1}`} className="w-full h-auto block" />
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

// Section renderer
// Renders text with [bracketed words] italicized
function renderWithItalics(text: string) {
  const parts = text.split(/(\[[^\]]*\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return <em key={i}>[{part.slice(1, -1)}]</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const SectionBlock = forwardRef<HTMLElement, {section: Section;}>(({ section }, ref) => {
  if (section.type === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="my-10">
        
        <a
          href="#instructions-body"
          className="group flex items-center justify-between gap-4 w-full rounded-2xl border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-all px-6 py-5 cursor-pointer no-underline"
          style={{ textDecoration: "none" }}>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">🗺️</span>
            <span
              className="text-lg md:text-xl font-bold text-primary tracking-wide"
              style={{ fontFamily: "'Cinzel Decorative', serif", letterSpacing: "0.04em" }}>
              
              {section.label}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-primary/60 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </a>
      </motion.div>);

  }

  if (section.type === "image") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.5 }}
        className="my-0 w-full">
        
        <img
          src={section.imageUrl}
          alt="Story page"
          className="w-full h-auto block"
          style={{ display: "block" }} />
        
      </motion.div>);

  }

  if (section.type === "chapter") {
    return (
      <section ref={ref} className="mt-16 mb-8 scroll-mt-20">
        <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}>
          
        </motion.div>
      </section>);

  }

  if (section.type === "subtitle") {
    return (
      <motion.blockquote
        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5 }}
        className="my-8 px-6 border-l-2 border-black/30 italic text-center md:text-left"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", lineHeight: "1.7", color: "#1a1a1a" }}>
        
        {section.content}
      </motion.blockquote>);

  }

  if (section.type === "break") {
    return (
      <div className="my-10 flex items-center justify-center gap-3">
        <div className="w-1 h-1 rounded-full bg-primary/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        <div className="w-1 h-1 rounded-full bg-primary/40" />
      </div>);

  }

  if (section.type === "prose") {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5 }}
        className="my-5 leading-relaxed text-foreground"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", lineHeight: "1.85" }}>
        {renderWithItalics(section.content ?? "")}
      </motion.p>);

  }

  return null;
});
SectionBlock.displayName = "SectionBlock";
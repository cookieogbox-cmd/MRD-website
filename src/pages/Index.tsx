import { motion } from "motion/react";
import { BookOpen, Clock, Globe, ScrollText, Sparkles, Star, Feather, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import CommentSection from "@/components/comment-section.tsx";
import MagicalMustNote from "./_components/magical-must-note.tsx";
import { LikeButton, ReaderCount } from "@/components/like-button.tsx";
import { api } from "@/convex/_generated/api.js";
import { formatDistanceToNow } from "date-fns";

type CommentGroup = "general" | "scarheart" | "purple" | "gold-blue-green";

function RecentCommentsPreview({ group }: {group: CommentGroup;}) {
  const recent = useQuery(api.comments.getRecentComments, { group, limit: 3 });

  if (!recent || recent.length === 0) return null;

  return (
    <div className="border-t border-border pt-4 mt-2 flex flex-col gap-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider"
      style={{ fontFamily: "'Cinzel Decorative', serif" }}>
        Recent Comments
      </p>
      {recent.map((c) =>
      <div key={c._id} className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0 mt-0.5">
            {c.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground mr-1">{c.authorName}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">{c.content}</span>
            <span className="text-[10px] text-muted-foreground/60 block">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      )}
    </div>);

}

const LANGUAGES = [
"English", "Chinese", "Arabic", "Spanish", "Hindi", "French",
"Korean", "Zulu", "Portuguese", "Russian", "Urdu", "Bengali",
"Indonesian", "German", "Vietnamese", "Swahili", "Hausa", "Japanese"];



const FEATURES = [
{
  icon: Clock,
  title: "44-Minute Episodes",
  description:
  "Each installment is crafted to be completed in exactly 44 minutes — the perfect pocket of time for modern lives."
},
{
  icon: ScrollText,
  title: "e-Scrolls & Subtitles",
  description:
  "Dynamic subtitle overlays and scroll-native layouts transform reading into a cinematic, layered experience."
},
{
  icon: Globe,
  title: "18 Languages",
  description:
  "Every episode is available across 18 languages, making magic accessible to readers and language learners worldwide."
},
{
  icon: Sparkles,
  title: "Peacock-Book Format",
  description:
  "The next era of literature. Iridescent storytelling that blends magic, memory, and rebellion for the modern soul."
}];


const TESTIMONIALS = [
{
  quote: "I finished Episode One in my lunch break and haven't thought about anything else since.",
  name: "Amara K.",
  tag: "Language Learner"
},
{
  quote: "The e-Scroll format feels like reading inside a dream. Nothing else reads like this.",
  name: "Theo R.",
  tag: "Fantasy Reader"
},
{
  quote: "Malka Raurah's story hit me somewhere deep. I read it in French and English simultaneously.",
  name: "Chloé M.",
  tag: "Dreamer"
}];


const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function Index() {
  const chapters = useQuery(api.chapters.list, {});
  const flagship = useQuery(api.books.getFlagship, {});
  const seedDefaults = useMutation(api.chapters.seedDefaults);
  const ensureFoundation = useMutation(api.migrations.ensureFoundation);

  useEffect(() => {
    // Seed default chapters, then ensure the books/realms foundation exists
    // and backfill bookId on all existing content. Idempotent + safe to retry.
    seedDefaults().
    then(() => ensureFoundation()).
    catch(() => {/* ignore if already seeded/migrated */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(https://hercules-cdn.com/file_y7JmP3RnvHlO0es6L7s50Kvk)` }} />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        {/* Iridescent glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="show">
          
          <motion.div variants={fadeUp}>
            <Badge
              className="mb-6 px-4 py-1.5 tracking-widest uppercase border-primary/40 text-primary bg-primary/10 text-3xl"
              variant="outline">Just the beginning


            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="md:text-7xl font-bold text-balance mb-6 text-sm"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            
            Malka Rahab&apos;s
            <br />
            <span className="text-primary">Diaries</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="md:text-xl max-w-2xl mx-auto mb-10 text-yellow-400 text-3xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Welcome to the digital realm of Alke. A Magical Hidden World where mortals, young or old unite, celebrate and rise together. Alkebulan is the only realm where non-lack. Treasures, magic, mortals, immortals, common, rare, black, white, green. Thus---Welcome and Ease.


          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/episodes">
              <Button size="lg" className="cursor-pointer text-base px-8 py-6">
                <ScrollText className="w-5 h-5 mr-2" />
                All Scrolls
              </Button>
            </Link>
            <Link to="/book/01">
              <Button size="lg" variant="secondary" className="cursor-pointer text-base px-8 py-6">
                <BookOpen className="w-5 h-5 mr-2" />
                Scrolls Series
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" as const }}>
          
          <div className="w-px h-12 bg-gradient-to-b from-primary/60 to-transparent mx-auto" />
        </motion.div>
      </section>

      {/* ── Magical Billboard ─────────────────────── */}
      <section className="py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[10px] tracking-[0.3em] uppercase text-primary/60 mb-8"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>New Era, Old Alkebulan


          </motion.p>

          {/* Billboard network links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* All Scrolls */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}>
              
              <Link to="/episodes" className="group block cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden border border-primary/20 hover:border-primary/60 transition-all duration-300 bg-card/40 backdrop-blur-sm p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                    <ScrollText className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                      All e-Scrolls
                    </h3>
                    <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Browse every episode across all series and languages
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {["Free", "Paid", "18 Languages"].map((tag) =>
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 text-primary/70">
                          {tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            </motion.div>

            {/* Scrolls Series */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}>
              
              <Link to="/book/01" className="group block cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden border border-accent/20 hover:border-accent/60 transition-all duration-300 bg-card/40 backdrop-blur-sm p-6 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
                    <BookOpen className="w-7 h-7 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Scrolls Series
                    </h3>
                    <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Follow complete series from any book across all volumes
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {["Scar-heart", "MRD Green", "MRD Purple"].map((tag) =>
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-accent/20 text-accent/70">
                          {tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-accent/40 group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Floating stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            
            {[
            { icon: Clock, label: "44 min per episode", color: "text-primary" },
            { icon: Globe, label: "18 languages", color: "text-accent" },
            { icon: Zap, label: "Free to start", color: "text-primary" },
            { icon: Sparkles, label: "Peacock-Book era", color: "text-accent" }].
            map(({ icon: Icon, label, color }) =>
            <span key={label} className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${color}`} />
                {label}
              </span>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Diaries Color Code ─────────────────────────── */}
      <section id="diaries-color-code" className="py-24 px-6 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('https://hercules-cdn.com/file_4iv1hJZ2hmMjDwMD1b0hB9ck')" }} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Image above heading */}
          <div className="flex justify-center mb-10">
            <img
              src="https://hercules-cdn.com/file_4iv1hJZ2hmMjDwMD1b0hB9ck"
              alt="Malka's Diaries mural"
              className="w-full max-w-3xl rounded-2xl shadow-2xl opacity-80 object-cover"
              style={{ maxHeight: "320px" }} />
            
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">
            
            <p
              className="text-primary text-xs tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}>Malka's Raw and Real Diaries color code


            </p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}> Keep𑣲保持 scrolling𑣲滚动!


            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem" }}>Each color represent a genre of topic, mini monthly e-books meant to stir magic, revel, scatter, heal, undo and do. 

            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
            { name: "Green", url: "https://hercules-cdn.com/file_oxTCpNZbEJtxC2Ysmd8dvxbe" },
            { name: "Purple", url: "https://hercules-cdn.com/file_znanyVjdlNtrAm4D027fxZYI" },
            { name: "Blue", url: "https://hercules-cdn.com/file_iUKWaDx7tJQmz0FoVnacb2GM" },
            { name: "Gold", url: "https://hercules-cdn.com/file_8Rcsw8RfWNyshaPxcPJyaUQ2" }].
            map((color, i) =>
            <motion.div
              key={color.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center gap-3">
              
                <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-border/30">
                  <img
                  src={color.url}
                  alt={`${color.name} edition`}
                  className="w-full h-auto object-cover" />
                
                </div>
                <p
                className="text-sm font-semibold tracking-wide text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                
                  {color.name}
                </p>
              </motion.div>
            )}
          </div>

          {/* Gold/Blue/Green Gossipers comments */}
          <div className="mt-16 max-w-4xl mx-auto">
            <CommentSection
              group="gold-blue-green"
              title="Gold / Blue / Green Gossipers"
              description="Discuss the diary editions — Gold, Blue, and Green — and what they mean to you." />
            
          </div>

          {/* Purple Gossipers anchor + comments */}
          <div id="purple-diaries-color-code" className="mt-16 max-w-4xl mx-auto">
            <CommentSection
              group="purple"
              title="Purple Gossipers"
              description="Reflect on the mystical and the rare — the Purple diary and its secrets." />
            
          </div>
        </div>
      </section>
      <section id="series" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">
            
            <p
              className="text-primary text-xs tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}>Five years craft; deeply personal and Fantastical!


            </p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}>Scarheart-Malka Raurah


            </h2>
            <p
              className="max-w-xl mx-auto text-lg text-red-500"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>



            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Book cover */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative flex justify-center">
              
              <div className="relative">
                {/* Glow behind cover */}
                
                <img
                  src="https://hercules-cdn.com/file_zwKoMroNRzrAPhnO04OOvFqt"
                  alt="Scar-heart Malka Raurah Episode One Cover"
                  className="relative w-64 md:w-72 rounded-2xl shadow-2xl border border-border/50" />
                
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Episode1 

                </div>
              </div>
            </motion.div>

            {/* Episode details */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6">
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary">Fantasy</Badge>
                <Badge variant="outline" className="border-accent/40 text-accent-foreground">Magic</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">All ages</Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">Memory</Badge>
              </div>
              <MagicalMustNote />
              <p
                className="text-muted-foreground leading-relaxed text-lg"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>




              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> 44 minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-accent" /> 18 languages
                </span>
                <span className="flex items-center gap-1.5">
                  <ScrollText className="w-4 h-4 text-muted-foreground" /> e-Scroll format
                </span>
              </div>
              {flagship &&
              <div className="flex flex-wrap items-center gap-3">
                  <LikeButton
                  targetType="book"
                  targetKey={flagship._id}
                  baseLikes={flagship.baseLikes ?? 0} />
                
                  <ReaderCount
                  count={flagship.baseReaders ?? 0}
                  cadence={flagship.readerCadence ?? "daily"} />
                
                </div>
              }
              <Link to="/episodes">
                <Button size="lg" className="cursor-pointer w-full sm:w-auto px-8">
                  <BookOpen className="w-5 h-5 mr-2" /> Begin Reading — Free
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Episode list preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {(chapters ?? [
            { number: "01", title: "Chapter 1", status: "free" as const, seriesColor: "Scar-heart Malka Raurah", _id: "01" as unknown as import("@/convex/_generated/dataModel.js").Id<"chapters"> },
            { number: "02", title: "Chapter 2", status: "coming" as const, seriesColor: "MRD Green", _id: "02" as unknown as import("@/convex/_generated/dataModel.js").Id<"chapters"> },
            { number: "03", title: "Chapter 3", status: "coming" as const, seriesColor: "MRD Purple", _id: "03" as unknown as import("@/convex/_generated/dataModel.js").Id<"chapters"> },
            { number: "04", title: "Chapter 4", status: "coming" as const, seriesColor: "MRD Blue", _id: "04" as unknown as import("@/convex/_generated/dataModel.js").Id<"chapters"> },
            { number: "05", title: "Chapter 5", status: "coming" as const, seriesColor: "MRD Gold", _id: "05" as unknown as import("@/convex/_generated/dataModel.js").Id<"chapters"> }]).
            map((item) =>
            <Link to={`/book/${item.number}`} key={item._id}>
              <div
                className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors cursor-pointer h-full">
                
                <span
                  className="text-2xl font-bold text-primary/40"
                  style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                  {item.number}
                </span>
                {item.seriesColor &&
                <span className="text-sm font-semibold text-foreground leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>{item.seriesColor}</span>
                }
                <Badge
                  variant={item.status === "free" ? "default" : "outline"}
                  className="self-start text-xs">
                  {item.status === "free" ? "Free" : item.status === "paid" ? "Paid" : "Coming"}
                </Badge>
              </div>
            </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">
            
            <p
              className="text-primary text-xs tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              
              The Format
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}>Think of this as a mere MV, enjoy the story while we make the app possible.


            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}>
            
            {FEATURES.map((f) =>
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-all hover:-translate-y-1">
              
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3
                className="text-lg font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                
                  {f.title}
                </h3>
                <p
                className="text-muted-foreground text-sm leading-relaxed flex-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
                
                  {f.description}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Languages ───────────────────────────────── */}
      <section id="languages" className="py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14">
            
            <p
              className="text-primary text-xs tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              
              Accessible Magic
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              
              18 Languages
            </h2>
            <p
              className="text-muted-foreground max-w-lg mx-auto"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
              
              Read in your mother tongue or practice a new one. Every episode is a gateway
              to language as much as story.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap gap-3 justify-center">
            
            {LANGUAGES.map((lang, i) =>
            <motion.div
              key={lang}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              whileHover={{ scale: 1.08 }}
              className="px-4 py-2 rounded-full border border-border bg-card text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all cursor-pointer"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
              
                {lang}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────── */}
      <section className="py-24 px-6 bg-card/20">
        














































        
      </section>

      {/* ── Portal Image ───────────────────────────── */}
      <div className="flex justify-center px-6 pb-2 -mt-8">
        <div className="relative w-full max-w-sm rounded-xl overflow-hidden">
          <img
            src="https://hercules-cdn.com/file_ZXLZiEAOc3asKEmPV1AHWwct"
            alt="Malka's Diaries e-Scroll Portal"
            className="w-full" />
          
        </div>
      </div>

      {/* ── Reader Groups ───────────────────────────── */}
      <section id="reader-groups" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14">
            <p className="text-primary text-xs tracking-widest uppercase mb-3"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              The Community
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}>
              Garogure Were Reader Groups
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Every reader belongs to a group. Each group brings its own voice, its own lens, and its own way of living inside the story.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}>

            {[
            {
              name: "General Comments",
              icon: "✦",
              color: "border-border",
              accent: "text-primary",
              link: "/read/01",
              groupKey: "general" as CommentGroup,
              description: "The open forum for all readers of Scar-heart Malka Raurah. Anyone can leave a thought, a reaction, or a question here — no group membership required.",
              style: "Wide-ranging and welcoming. Expect first impressions, casual observations, and the occasional spark that starts a deeper thread."
            },
            {
              name: "Scarheart Gossipers",
              icon: "◆",
              color: "border-primary/40",
              accent: "text-primary",
              link: "/read/01#scarheart-comments",
              groupKey: "scarheart" as CommentGroup,
              description: "Dedicated followers of Malka's journey and the lore of the scarred. This group digs into character motivations, hidden meanings, and the emotional undercurrent of every scene.",
              style: "Passionate and detail-obsessed. Their comments read like a second text — full of theories, callbacks, and heartfelt reactions."
            },
            {
              name: "Purple Gossipers",
              icon: "❖",
              color: "border-accent/40",
              accent: "text-accent",
              link: "/#purple-diaries-color-code",
              groupKey: "purple" as CommentGroup,
              description: "Drawn to the mystical and the rare. Purple Gossipers focus on the magic system, ancient lore, and the deeper cosmic rules that govern the world of Alke.",
              style: "Measured and poetic. They write in full sentences, often quoting the text directly, and tend to ask questions that linger long after the chapter ends."
            },
            {
              name: "Gold / Blue / Green Gossipers",
              icon: "⬡",
              color: "border-yellow-500/30",
              accent: "text-yellow-500",
              link: "/#diaries-color-code",
              groupKey: "gold-blue-green" as CommentGroup,
              description: "A triad of reader factions aligned by allegiance within the story's world — Gold for the noble houses, Blue for the memory-keepers, Green for the scarred and the forgotten.",
              style: "Competitive and spirited. Each faction defends its corner with loyalty, and their comment threads often turn into the liveliest debates in the entire community."
            }].
            map((group) =>
            <motion.div
              key={group.name}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
              }}
              className={`bg-card border ${group.color} rounded-2xl p-7 flex flex-col gap-4 hover:border-primary/40 transition-colors duration-300`}>
                <div className="flex items-start gap-4">
                  <span className={`text-2xl ${group.accent} flex-shrink-0 mt-0.5`}>{group.icon}</span>
                  <div>
                    <Link to={group.link}>
                      


                    
                    </Link>
                    <p className="text-muted-foreground text-sm leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
                      {group.description}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5"
                style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "0.65rem" }}>
                    Commenting Style
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed italic"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
                    {group.style}
                  </p>
                </div>
                <RecentCommentsPreview group={group.groupKey} />
                <Link to={group.link} className="mt-auto">
                  

                
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-primary/60 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-2xl mx-auto text-center space-y-6">
          
          <Feather className="w-10 h-10 text-primary mx-auto" />
          <h2
            className="text-4xl md:text-5xl font-bold text-balance"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            
            Begin the Journey
          </h2>
          <p
            className="text-muted-foreground text-lg"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            
            Episode One is free. The story is waiting. The Peacock-Book era starts now.
          </p>
          <Link to="/episodes">
            <Button size="lg" className="cursor-pointer px-10 py-6 text-base">
              <BookOpen className="w-5 h-5 mr-2" />
              Read Scar-heart Malka Raurah — Episode One
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-primary" />
            <span
              className="font-bold text-primary tracking-widest uppercase text-xs"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}>
              
              Malkarahabsdiaries.io
            </span>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Pioneering the Peacock-Book era. Magic, memory &amp; rebellion in 44 minutes.
          </p>
          <div className="flex justify-center gap-4 my-4">
            <a href="https://www.instagram.com/malkasdiariess?igsh=cmc2OWpyaWd1dHFq" target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Instagram">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@malkarahabb?_r=1&_t=ZP-97W67fxOmaM" target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="TikTok">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z" /></svg>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61591287695408&mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Facebook">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
            <a href="https://youtube.com/@malkasdiaries-220?si=K5oYjj5zgO_G0ZI6" target="_blank" rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="YouTube">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          </div>
          <p>&copy; {new Date().getFullYear()} Malka Rahab&apos;s Diaries. All rights reserved.</p>
        </div>
      </footer>
    </div>);

}
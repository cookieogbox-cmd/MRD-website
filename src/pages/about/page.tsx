import { motion } from "motion/react";
import { Feather, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

const PARAGRAPHS = [
  `My age? even I wonder, perhaps that's a secret to the cosmos hidden to mortals' calendars, but oh how well I know that I'm a soul forever entwined with words, I confess, oh verily that sane girl lost in this endless waltz with that language of soul, soil, cosmic, and Divine. To me... Life is utterly simple, I'm free to me, you are free to you, compassion is a clear mirror of mortals' super power, wisdom is to share whatever you possess, and pain is rather the finest of chisels in molding one's character, in the best of ways. I'm for freedom, peace, justice, and truth even when it smolders with bitter dull ache.`,
  `I'm firm in my boundaries, convictions, and truths. My stands are as fluid as my personality, and none may reshuffle, redirect my flow, or use my validity without my consent, my power belongs to me. I cascade with currents calling my soul, what's right or true, and that's it. I play not by no man-made rule-book, I sail my own boat through the vastness of existence on this Earthly realm, boundlessly, my compass lies clear before my gaze, for I follow naught but what my Lord has sent from heaven (e.g., Quran, Hadith).`,
  `To me... Africa is naught, but Alkebulan, oh realm of the Blacks, is everything.`,
  `Malka Rahab is my name, a name carrying weight and prophecy of my ancestors, Eve or Hawwa, the river of life that's my nickname too. Yes, and I dare to declare I am the audacious, and the fearless one, the roar and royalty, the tuned tone, and the untamed thunder, the waltz of wonder and warrior, the traveler of worlds, but forever the child of the realm of Alkebulan. I'm Ummant Muhammadan 𑣲[among the nation of Muhammadan (sws)]. His footsteps I tread with gratitude, for this path is my delight.`,
  `My role models come from most fabled eras I know, from Queen Amanirenas of Kerma and Kemet 𑣲[Sudan and Egypt] to Cleopatra, Queen of Sheba to Khalid Ibn Walid, the Sword of Allah, Princess Diana to Zaynab, the daughter of Fatima Al-Zahra, the Radiant, and Ali, the Lion of Allah to Captain Ibrahim Traoré, Knight of Alkebulan, disperser of shadows and protector of our great realm, rise, oh rise our knight against the vestiges of 'Africa' until our true continent reclaims its glory. I'm Your number one Fan, should your Excellency ever be in need of a soldier to strengthen your soldiers, I, Malka, enchanted by your Excellency would willingly offer myself in marriage. Marry Me, I am courageous enough to fight on the front lines for our great realm! This is no mere joke! How dare I?`,
  `Asalam wa alaykum 𑣲[Peace be unto you]`,
];

export default function AboutPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
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
          <Link to="/" className="hover:text-foreground transition-colors cursor-pointer">Home</Link>
          <Link to="/episodes" className="hover:text-foreground transition-colors cursor-pointer">Episodes</Link>
        </div>
        <Link to="/episodes">
          <Button size="sm" className="cursor-pointer">
            Start Reading <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center mx-auto shadow-2xl">
            <Feather className="w-10 h-10 text-primary" />
          </div>
          {/* Orbit ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 scale-125 animate-pulse" />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show">
          <motion.p
            variants={fadeUp}
            className="text-primary text-xs tracking-widest uppercase mb-3"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            The Author
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold text-balance mb-4"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Malka Rahab
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Eve. Hawwa. The river of life.
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-primary/70 text-base tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
            Asalam wa alaykum — Peace be unto you
          </motion.p>
        </motion.div>
      </section>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-4 px-6 mb-16">
        <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-primary/30" />
        <Feather className="w-4 h-4 text-primary/50" />
        <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-primary/30" />
      </div>

      {/* Body text */}
      <section className="px-6 pb-28 max-w-3xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-10">
          {PARAGRAPHS.map((para, i) => (
            <motion.p
              key={i}
              variants={fadeUp}
              className={`leading-relaxed text-foreground/90 ${
                para.startsWith("To me... Africa") || para.startsWith("Asalam")
                  ? "text-xl font-semibold text-primary text-center py-4 border-y border-primary/20"
                  : "text-lg"
              }`}
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem" }}>
              {para}
            </motion.p>
          ))}
        </motion.div>

        {/* Closing signature */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 text-center space-y-4">
          <div className="w-px h-16 bg-gradient-to-b from-primary/60 to-transparent mx-auto" />
          <p
            className="text-2xl font-bold text-primary"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Malka Rahab
          </p>
          <p
            className="text-muted-foreground text-sm tracking-widest uppercase"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Author · Dreamer · Daughter of Alkebulan
          </p>
          <div className="pt-4">
            <Link to="/episodes">
              <Button size="lg" className="cursor-pointer px-8">
                <Feather className="w-4 h-4 mr-2" />
                Read the Diaries
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
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
          <p>&copy; {new Date().getFullYear()} Malka Rahab&apos;s Diaries. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

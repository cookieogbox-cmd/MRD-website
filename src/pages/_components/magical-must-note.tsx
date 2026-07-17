import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ChevronDown } from "lucide-react";
import { useEffect } from "react";

// The "Magical Must Note": a bold, glowing, tappable headline that unfurls its
// full story note when clicked. Fully admin-editable via the Site Text tab.
export default function MagicalMustNote() {
  const note = useQuery(api.siteText.get, { key: "must_note" });
  const seedDefaults = useMutation(api.siteText.seedDefaults);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Ensure the default note exists. Idempotent + safe to retry.
    seedDefaults().catch(() => {/* already seeded */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While loading or before seeding, render nothing to avoid layout flash.
  if (note === undefined || note === null) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group w-full text-left cursor-pointer"
        aria-expanded={open}
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/40 to-accent/10 p-5 transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10">
          {/* Soft glow orb */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

          <div className="relative flex items-start gap-3">
            <motion.span
              animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="mt-0.5 flex-shrink-0"
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.span>

            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-base md:text-lg text-foreground leading-snug"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {note.title}
              </h3>
              {note.cta && (
                <span className="mt-1 inline-flex items-center gap-1 text-sm text-primary/90 font-medium">
                  {note.cta}
                  <motion.span
                    animate={{ y: open ? 0 : [0, 3, 0] }}
                    transition={{ repeat: open ? 0 : Infinity, duration: 1.4 }}
                    className="inline-flex"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                  </motion.span>
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p
              className="text-muted-foreground leading-relaxed text-lg pt-4 px-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {note.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

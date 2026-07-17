import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Heart, Sparkles, X } from "lucide-react";
import { useBgTheme, type ThemeBg, type Overlay, type OverlayColor } from "./bg-theme-context.tsx";

const BG_OPTIONS: { value: ThemeBg; label: string; preview: string }[] = [
  { value: "gradient", label: "Magical", preview: "linear-gradient(135deg, #3e0a0a, #2d0a3e, #0a1a3e, #0a2e1a, #3e2e0a)" },
  { value: "black", label: "Black", preview: "#0a0a0a" },
  { value: "white", label: "White", preview: "#f8f6f3" },
  { value: "red", label: "Red", preview: "linear-gradient(135deg, #3e0a0a, #1a0505)" },
  { value: "purple", label: "Purple", preview: "linear-gradient(135deg, #2d0a3e, #0d0520)" },
  { value: "blue", label: "Blue", preview: "linear-gradient(135deg, #0a1a3e, #050d1a)" },
  { value: "green", label: "Green", preview: "linear-gradient(135deg, #0a2e1a, #051a0d)" },
  { value: "gold", label: "Gold", preview: "linear-gradient(135deg, #3e2e0a, #1a150a)" },
];

const OVERLAY_OPTIONS: { value: Overlay; label: string; icon: string }[] = [
  { value: "none", label: "None", icon: "—" },
  { value: "hearts", label: "Hearts", icon: "♥" },
  { value: "bows", label: "Bows", icon: "🎀" },
  { value: "sparkles", label: "Sparkles", icon: "✦" },
];

const OVERLAY_COLORS: { value: OverlayColor; hex: string }[] = [
  { value: "red", hex: "#dc2626" },
  { value: "purple", hex: "#a855f7" },
  { value: "blue", hex: "#3b82f6" },
  { value: "green", hex: "#22c55e" },
  { value: "gold", hex: "#eab308" },
  { value: "white", hex: "#ffffff" },
];

export default function ThemeToolbar() {
  const { bg, setBg, overlay, setOverlay, overlayColor, setOverlayColor } = useBgTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Customize theme"
      >
        {open ? <X className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="fixed bottom-20 right-6 z-[60] w-72 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <h3
                className="text-sm font-bold tracking-wider uppercase text-primary"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}
              >
                Customize Realm
              </h3>
            </div>

            <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Background */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Background
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {BG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBg(opt.value)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all cursor-pointer ${
                        bg === opt.value
                          ? "border-primary ring-1 ring-primary/50 scale-105"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-md border border-white/10"
                        style={{ background: opt.preview }}
                      />
                      <span className="text-[9px] text-muted-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Decorations */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Decorations
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {OVERLAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOverlay(opt.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all cursor-pointer ${
                        overlay === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-[9px] text-muted-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Decoration Color */}
              {overlay !== "none" && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Decoration Color
                  </p>
                  <div className="flex gap-2">
                    {OVERLAY_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setOverlayColor(c.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                          overlayColor === c.value
                            ? "border-white scale-110 ring-2 ring-primary/50"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ background: c.hex }}
                        aria-label={c.value}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

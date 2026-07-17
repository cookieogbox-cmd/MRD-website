import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ThemeBg =
  | "gradient"
  | "black"
  | "white"
  | "red"
  | "purple"
  | "blue"
  | "green"
  | "gold";

export type Overlay = "none" | "hearts" | "bows" | "sparkles";
export type OverlayColor = "red" | "purple" | "blue" | "green" | "gold" | "white";

type BgContextType = {
  bg: ThemeBg;
  setBg: (bg: ThemeBg) => void;
  overlay: Overlay;
  setOverlay: (o: Overlay) => void;
  overlayColor: OverlayColor;
  setOverlayColor: (c: OverlayColor) => void;
};

const BgContext = createContext<BgContextType | null>(null);

const STORAGE_KEY = "mrd-theme-bg";
const OVERLAY_KEY = "mrd-overlay";
const OVERLAY_COLOR_KEY = "mrd-overlay-color";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function BgProvider({ children }: { children: ReactNode }) {
  const [bg, _setBg] = useState<ThemeBg>(() => readStorage<ThemeBg>(STORAGE_KEY, "gradient"));
  const [overlay, _setOverlay] = useState<Overlay>(() => readStorage<Overlay>(OVERLAY_KEY, "none"));
  const [overlayColor, _setOverlayColor] = useState<OverlayColor>(() =>
    readStorage<OverlayColor>(OVERLAY_COLOR_KEY, "gold")
  );

  const setBg = useCallback((v: ThemeBg) => {
    _setBg(v);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  }, []);

  const setOverlay = useCallback((v: Overlay) => {
    _setOverlay(v);
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(v));
  }, []);

  const setOverlayColor = useCallback((v: OverlayColor) => {
    _setOverlayColor(v);
    localStorage.setItem(OVERLAY_COLOR_KEY, JSON.stringify(v));
  }, []);

  return (
    <BgContext.Provider value={{ bg, setBg, overlay, setOverlay, overlayColor, setOverlayColor }}>
      {children}
    </BgContext.Provider>
  );
}

export function useBgTheme() {
  const ctx = useContext(BgContext);
  if (!ctx) throw new Error("useBgTheme must be inside BgProvider");
  return ctx;
}

/** CSS gradient/color for background */
export function bgStyle(bg: ThemeBg): React.CSSProperties {
  switch (bg) {
    case "gradient":
      return {
        background:
          "linear-gradient(135deg, #1a0a0a 0%, #2d0a3e 20%, #0a1a3e 40%, #0a2e1a 60%, #3e2e0a 80%, #1a0a0a 100%)",
      };
    case "black":
      return { background: "#0a0a0a" };
    case "white":
      return { background: "#f8f6f3" };
    case "red":
      return {
        background: "linear-gradient(135deg, #1a0505 0%, #3e0a0a 50%, #1a0505 100%)",
      };
    case "purple":
      return {
        background: "linear-gradient(135deg, #0d0520 0%, #2d0a3e 50%, #0d0520 100%)",
      };
    case "blue":
      return {
        background: "linear-gradient(135deg, #050d1a 0%, #0a1a3e 50%, #050d1a 100%)",
      };
    case "green":
      return {
        background: "linear-gradient(135deg, #051a0d 0%, #0a2e1a 50%, #051a0d 100%)",
      };
    case "gold":
      return {
        background: "linear-gradient(135deg, #1a150a 0%, #3e2e0a 50%, #1a150a 100%)",
      };
  }
}

/** Get text color class based on bg */
export function textForBg(bg: ThemeBg): string {
  return bg === "white" ? "text-gray-900" : "text-white";
}

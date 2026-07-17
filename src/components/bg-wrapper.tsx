import { useBgTheme, bgStyle } from "./bg-theme-context.tsx";
import DecorativeOverlay from "./decorative-overlay.tsx";
import ThemeToolbar from "./theme-toolbar.tsx";
import { useLocation } from "react-router-dom";

/**
 * Wraps the app with the dynamic background, decorative overlays,
 * and the floating theme toolbar. Skips on admin pages.
 */
export default function BgWrapper({ children }: { children: React.ReactNode }) {
  const { bg } = useBgTheme();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Don't apply custom background on admin pages
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen relative" style={bgStyle(bg)}>
      <DecorativeOverlay />
      <div className="relative z-[2]">{children}</div>
      <ThemeToolbar />
    </div>
  );
}

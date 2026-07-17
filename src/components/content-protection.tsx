import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global content protection — prevents copying text, saving images,
 * and right-clicking across all content pages.
 * Admin pages are exempt to allow editing. Form inputs remain functional.
 */
export function ContentProtection({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    // Skip protection on admin pages
    if (isAdmin) return;

    // Block right-click context menu everywhere except form inputs
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
      e.preventDefault();
    };

    // Block copy/cut on non-input elements
    const handleCopyCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;
      e.preventDefault();
    };

    // Block drag on images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === "img") {
        e.preventDefault();
      }
    };

    // Block common keyboard shortcuts for saving/printing
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;

      // Block Ctrl/Cmd + S (save), P (print), U (view source), C (copy)
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyCut);
    document.addEventListener("cut", handleCopyCut);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCut);
      document.removeEventListener("cut", handleCopyCut);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAdmin]);

  return (
    <div className={isAdmin ? "" : "select-none"}>
      {children}
    </div>
  );
}

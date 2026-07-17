import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ScrollText,
  Library,
  Users,
  Newspaper,
  Globe,
  Coins,
  ChevronLeft,
  ChevronRight,
  Feather,
  Menu,
  X,
  LogIn,
  ImageIcon,
  Film,
  Lock,
} from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuth } from "@/hooks/use-auth.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import TokenBalance from "@/components/token-balance.tsx";
import { toast } from "sonner";

type NavItem = {
  label: string;
  icon: typeof ScrollText;
  href: string;
  description: string;
  locked?: boolean;
};

// Only the Library stays open. Everything else is sealed behind a
// "coming soon" charm until its realm is ready.
const NAV_ITEMS: NavItem[] = [
  {
    label: "Library",
    icon: Library,
    href: "/library",
    description: "All books",
  },
  {
    label: "e-Scrolls",
    icon: ScrollText,
    href: "/episodes",
    description: "Browse episodes",
    locked: true,
  },
  {
    label: "Vive",
    icon: Users,
    href: "/vive",
    description: "Chat chambers",
    locked: true,
  },
  {
    label: "Vibes",
    icon: ImageIcon,
    href: "/vibes",
    description: "Image posts",
    locked: true,
  },
  {
    label: "Vide",
    icon: Film,
    href: "/vide",
    description: "Video reels",
    locked: true,
  },
  {
    label: "Newspapers",
    icon: Newspaper,
    href: "/upcoming",
    description: "Upcoming releases",
    locked: true,
  },
  {
    label: "Portal",
    icon: ScrollText,
    href: "/portal",
    description: "News & lore",
    locked: true,
  },
  {
    label: "Languages",
    icon: Globe,
    href: "/#languages",
    description: "18 languages",
    locked: true,
  },
  {
    label: "Tokens",
    icon: Coins,
    href: "/token-store",
    description: "Buy & manage tokens",
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signout } = useAuth();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return location.pathname === "/" && location.hash === href.slice(1);
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 cursor-pointer" onClick={() => setMobileOpen(false)}>
          <Feather className="w-5 h-5 text-sidebar-primary flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs font-bold tracking-widest text-sidebar-primary uppercase overflow-hidden whitespace-nowrap"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}
              >
                MRD
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = !item.locked && isActive(item.href);

          const inner = (
            <>
              <item.icon
                className={`w-4.5 h-4.5 flex-shrink-0 ${
                  active
                    ? "text-sidebar-primary"
                    : item.locked
                    ? "text-sidebar-foreground/30"
                    : "text-sidebar-foreground/60 group-hover:text-sidebar-primary/80"
                }`}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap flex-1 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.locked ? (
                      <Lock className="w-3 h-3 text-sidebar-foreground/30 flex-shrink-0" />
                    ) : (
                      active && (
                        <span className="sr-only">{item.description}</span>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          );

          // Locked items don't navigate — they whisper "coming soon".
          if (item.locked) {
            return (
              <button
                key={item.label}
                onClick={() =>
                  toast("Coming soon", {
                    description: `${item.label} will open in a future chapter of the realm.`,
                    icon: <Lock className="w-4 h-4" />,
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group w-full text-left text-sidebar-foreground/40 hover:bg-sidebar-accent/5 border border-transparent"
                title={collapsed ? `${item.label} — coming soon` : undefined}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                active
                  ? "bg-sidebar-accent/20 text-sidebar-primary border border-sidebar-primary/30"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground border border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Token balance */}
        <div className={`${collapsed ? "flex justify-center" : ""}`}>
          <TokenBalance compact={collapsed} />
        </div>

        {/* Auth */}
        <Authenticated>
          <button
            onClick={() => { signout(); setMobileOpen(false); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground transition-all cursor-pointer border border-transparent`}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogIn className="w-4.5 h-4.5 flex-shrink-0 rotate-180" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </Authenticated>
        <Unauthenticated>
          <div className={`${collapsed ? "flex justify-center" : ""}`}>
            <SignInButton />
          </div>
        </Unauthenticated>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 transition-all cursor-pointer border border-transparent"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-sidebar/90 backdrop-blur-sm border border-sidebar-border flex items-center justify-center cursor-pointer shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-sidebar-primary" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-sidebar/98 backdrop-blur-xl border-r border-sidebar-border flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sidebar-accent/20 flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-sidebar-foreground" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for desktop content offset */}
      <div
        className="hidden md:block flex-shrink-0 transition-all duration-250"
        style={{ width: collapsed ? 64 : 240 }}
      />
    </>
  );
}

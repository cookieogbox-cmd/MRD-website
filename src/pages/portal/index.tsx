import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { FileText } from "lucide-react";
import { motion } from "motion/react";

export default function PortalIndexPage() {
  const pages = useQuery(api.portal.listPublished, {});

  return (
    <div className="min-h-screen text-foreground">
      <div className="pt-8 pb-6 px-6 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Portal
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          News, lore, and world-building articles
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-12">
        {pages === undefined ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No pages published yet</p>
            <p className="text-sm">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((page, i) => (
              <motion.div
                key={page._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/portal/${page.slug}`}
                  className="block p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex gap-4">
                    {page.coverUrl && (
                      <img src={page.coverUrl} alt={page.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{page.title}</h3>
                      {page.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{page.subtitle}</p>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

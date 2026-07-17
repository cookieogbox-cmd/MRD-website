import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useParams, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export default function PortalPage() {
  const { slug } = useParams();
  const page = useQuery(api.portal.getBySlug, slug ? { slug } : "skip");

  if (page === undefined) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!page || !page.published) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">This page doesn{"'"}t exist or isn{"'"}t published yet.</p>
        <Link to="/">
          <Button variant="secondary" className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Cover image */}
      {page.coverUrl && (
        <div className="w-full h-48 md:h-64 relative overflow-hidden">
          <img src={page.coverUrl} alt={page.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <h1
          className="text-3xl md:text-4xl font-bold mt-4 mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-lg text-muted-foreground mb-8">{page.subtitle}</p>
        )}

        {/* Body rendered as paragraphs */}
        <div className="prose prose-invert max-w-none space-y-4">
          {page.body.split("\n").filter(Boolean).map((paragraph, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

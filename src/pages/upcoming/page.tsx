import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { CalendarIcon, BookOpenIcon } from "lucide-react";
import { motion } from "motion/react";

export default function UpcomingPage() {
  const episodes = useQuery(api.upcomingEpisodes.list, {});
  const contentBlocks = useQuery(api.contentBlocks.listVisible, {});

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background px-6 py-16 text-center border-b">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          
          <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-3">Scar-heart Malka Raurah</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">The Rise</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Follow the journey — new chapters and episodes drop here first. Stay ahead of the story.
          </p>
        </motion.div>
      </div>

      {/* Episodes */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        {episodes === undefined ?
        <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div> :
        episodes.length === 0 ?
        <div className="text-center py-20 text-muted-foreground">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-semibold">Nothing posted yet</p>
            
          </div> :

        <div className="space-y-4">
            {episodes.map((ep, i) =>
          <motion.div
            key={ep._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="flex gap-5 bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            
                {ep.resolvedCoverUrl &&
            <img
              src={ep.resolvedCoverUrl}
              alt={ep.title}
              className="w-20 h-28 object-cover rounded-xl flex-shrink-0" />

            }
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">{ep.chapter}</span>
                    <Badge variant={ep.status === "released" ? "default" : "secondary"} className="text-xs">
                      {ep.status === "released" ? "Out Now" : "Coming Soon"}
                    </Badge>
                    {ep.releaseDate &&
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        {ep.releaseDate}
                      </span>
                }
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-2 leading-snug">{ep.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>
                </div>
              </motion.div>
          )}
          </div>
        }
      </div>

      {/* Dynamic Content Blocks */}
      {contentBlocks === undefined ?
      <div className="max-w-3xl mx-auto px-6 pb-12 space-y-6">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div> :
      contentBlocks.length > 0 &&
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-12">
          {contentBlocks.map((block, i) =>
        <motion.div
          key={block._id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="border rounded-2xl p-8 bg-card shadow-sm">
          
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}>
                {block.title}
              </h2>
              {block.body &&
          <p className="text-muted-foreground leading-relaxed mb-6"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}>
                  {block.body}
                </p>
          }
              {block.resolvedImageUrl &&
          <img
            src={block.resolvedImageUrl}
            alt={block.title}
            className="w-full rounded-xl object-contain max-h-[600px]" />

          }
            </motion.div>
        )}
        </div>
      }
    </div>);

}
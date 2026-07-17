import { useState, useRef } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { Heart, ImagePlus, X, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function VibesPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.vibes.list,
    {},
    { initialNumItems: 12 }
  );
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="pt-8 pb-6 px-6 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Vibes
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Share your fan art, edits, and visual creations with the community
        </p>
      </div>

      {/* Create button */}
      <Authenticated>
        <div className="px-6 mb-6 flex justify-center">
          <Button onClick={() => setShowCreate(true)} className="gap-2 cursor-pointer">
            <ImagePlus className="w-4 h-4" /> Post a Vibe
          </Button>
        </div>
        {showCreate && <CreateVibeModal onClose={() => setShowCreate(false)} />}
      </Authenticated>
      <Unauthenticated>
        <div className="px-6 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Sign in to post vibes</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="px-6 mb-6 flex justify-center">
          <Skeleton className="h-10 w-32" />
        </div>
      </AuthLoading>

      {/* Grid */}
      {results === undefined || status === "LoadingFirstPage" ? (
        <div className="px-6 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl break-inside-avoid" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No vibes yet</p>
          <p className="text-sm">Be the first to share something creative!</p>
        </div>
      ) : (
        <>
          <div className="px-6 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {results.map((vibe) => (
              <VibeCard key={vibe._id} vibe={vibe} />
            ))}
          </div>
          {status === "CanLoadMore" && (
            <div className="flex justify-center py-8">
              <Button variant="secondary" onClick={() => loadMore(12)} className="cursor-pointer">
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type VibeWithUrl = {
  _id: Id<"vibes">;
  authorName: string;
  caption: string;
  imageUrl: string | null;
  tags: string[];
  likeCount: number;
  createdAt: string;
};

function VibeCard({ vibe }: { vibe: VibeWithUrl }) {
  const toggleLike = useMutation(api.vibes.toggleLike);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    setLiking(true);
    try {
      await toggleLike({ vibeId: vibe._id });
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      }
    } finally {
      setLiking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="break-inside-avoid rounded-xl overflow-hidden bg-card border border-border group"
    >
      {vibe.imageUrl && (
        <img src={vibe.imageUrl} alt={vibe.caption} className="w-full object-cover" />
      )}
      <div className="p-3 space-y-2">
        {vibe.caption && <p className="text-sm">{vibe.caption}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{vibe.authorName}</span>
          <span>{formatDistanceToNow(new Date(vibe.createdAt), { addSuffix: true })}</span>
        </div>
        {vibe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vibe.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <Authenticated>
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5" />
            {vibe.likeCount}
          </button>
        </Authenticated>
      </div>
    </motion.div>
  );
}

function CreateVibeModal({ onClose }: { onClose: () => void }) {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.vibes.generateUploadUrl);
  const createVibe = useMutation(api.vibes.create);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select an image");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json() as { storageId: Id<"_storage"> };
      await createVibe({
        caption: caption.trim(),
        imageStorageId: storageId,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Vibe posted!");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Failed to post vibe");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Post a Vibe</h3>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
            <button
              onClick={() => { handleFileChange(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload an image</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />

        <Input
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <Input
          placeholder="Tags (comma-separated, e.g. fanart, malka)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={uploading || !file} className="w-full cursor-pointer">
          {uploading ? "Posting..." : "Post Vibe"}
        </Button>
      </motion.div>
    </div>
  );
}

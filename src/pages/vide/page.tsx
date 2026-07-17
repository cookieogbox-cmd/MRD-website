import { useState, useRef } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion } from "motion/react";
import { Heart, Video, X, Upload, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function VidePage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.vides.list,
    {},
    { initialNumItems: 8 }
  );
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="pt-8 pb-6 px-6 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          
          Vide
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Share short video reels — book reviews, reactions, fan edits, and more
        </p>
      </div>

      {/* Create button */}
      <Authenticated>
        <div className="px-6 mb-6 flex justify-center">
          <Button onClick={() => setShowCreate(true)} className="gap-2 cursor-pointer">
            <Video className="w-4 h-4" /> Upload a Reel
          </Button>
        </div>
        {showCreate && <CreateVideModal onClose={() => setShowCreate(false)} />}
      </Authenticated>
      <Unauthenticated>
        <div className="px-6 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Sign in to upload reels</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="px-6 mb-6 flex justify-center">
          <Skeleton className="h-10 w-32" />
        </div>
      </AuthLoading>

      {/* Reels Grid */}
      {results === undefined || status === "LoadingFirstPage" ?
      <div className="px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) =>
        <Skeleton key={i} className="aspect-[9/16] w-full rounded-xl" />
        )}
        </div> :
      results.length === 0 ?
      <div className="text-center py-16 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No reels yet</p>
          <p className="text-sm">Be the first to share a video!</p>
        </div> :

      <>
          



        
          {status === "CanLoadMore" &&
        <div className="flex justify-center py-8">
              <Button variant="secondary" onClick={() => loadMore(8)} className="cursor-pointer">
                Load More
              </Button>
            </div>
        }
        </>
      }
    </div>);

}

type VideWithUrl = {
  _id: Id<"vides">;
  authorName: string;
  caption: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  createdAt: string;
};

function VideCard({ vide }: {vide: VideWithUrl;}) {
  const toggleLike = useMutation(api.vides.toggleLike);
  const [liking, setLiking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLike = async () => {
    setLiking(true);
    try {
      await toggleLike({ videId: vide._id });
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as {message: string;};
        toast.error(message);
      }
    } finally {
      setLiking(false);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden bg-card border border-border group relative">
      
      <div className="aspect-[9/16] relative cursor-pointer" onClick={handlePlay}>
        {vide.videoUrl ?
        <video
          ref={videoRef}
          src={vide.videoUrl}
          poster={vide.thumbnailUrl ?? undefined}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted /> :


        <div className="w-full h-full bg-muted flex items-center justify-center">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
        }
        {!playing &&
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="w-10 h-10 text-white/80" />
          </div>
        }
      </div>
      















      
    </motion.div>);

}

function CreateVideModal({ onClose }: {onClose: () => void;}) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.vides.generateUploadUrl);
  const createVide = useMutation(api.vides.create);

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
      toast.error("Please select a video");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file
      });
      const { storageId } = (await result.json()) as {storageId: Id<"_storage">;};
      await createVide({
        caption: caption.trim(),
        videoStorageId: storageId
      });
      toast.success("Reel uploaded!");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as {message: string;};
        toast.error(message);
      } else {
        toast.error("Failed to upload reel");
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
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Upload a Reel</h3>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {preview ?
        <div className="relative">
            <video src={preview} className="w-full max-h-64 object-cover rounded-lg" controls />
            <button
            onClick={() => {handleFileChange(null);if (fileInputRef.current) fileInputRef.current.value = "";}}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center cursor-pointer">
            
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div> :

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
          
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload a video</p>
            <p className="text-xs text-muted-foreground mt-1">MP4, WebM recommended</p>
          </div>
        }
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
        

        <Input
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)} />
        
        <Button onClick={handleSubmit} disabled={uploading || !file} className="w-full cursor-pointer">
          {uploading ? "Uploading..." : "Post Reel"}
        </Button>
      </motion.div>
    </div>);

}
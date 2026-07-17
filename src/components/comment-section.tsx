import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { MessageSquare, Send, Trash2, ChevronDown, ChevronUp, Reply } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDistanceToNow } from "date-fns";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";

type Group = "general" | "scarheart" | "purple" | "gold-blue-green";

type CommentDoc = Doc<"comments">;

function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

// ── Reply form ────────────────────────────────────────────────────────────────
function ReplyForm({
  group,
  parentId,
  onDone




}: {group: Group;parentId: Id<"comments">;onDone: () => void;}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const addComment = useMutation(api.comments.addComment);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await addComment({ group, content: trimmed, parentId });
      setText("");
      onDone();
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as {message: string;};
        toast.error(message);
      } else {
        toast.error("Failed to post reply");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-2 flex gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }} />
      
      <div className="flex flex-col gap-1.5">
        <Button size="sm" className="cursor-pointer px-3" onClick={submit} disabled={submitting || !text.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="cursor-pointer px-3 text-muted-foreground" onClick={onDone}>
          ✕
        </Button>
      </div>
    </div>);

}

// ── Single comment with replies ───────────────────────────────────────────────
function CommentItem({
  comment,
  group,
  currentUserId




}: {comment: CommentDoc;group: Group;currentUserId?: Id<"users"> | string;}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const replies = useQuery(api.comments.getReplies, showReplies ? { parentId: comment._id } : "skip");
  const deleteComment = useMutation(api.comments.deleteComment);

  const handleDelete = async () => {
    try {
      await deleteComment({ commentId: comment._id });
      toast.success("Comment deleted");
    } catch {
      toast.error("Could not delete comment");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="bg-card border border-border rounded-xl px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {comment.authorName}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          {currentUserId === comment.authorId &&
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Delete comment">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          }
        </div>
        {/* Content */}
        <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
          {comment.content}
        </p>
        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <Authenticated>
            <button
              onClick={() => setReplying((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <Reply className="w-3 h-3" /> Reply
            </button>
          </Authenticated>
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showReplies ? "Hide replies" : "View replies"}
          </button>
        </div>
      </div>

      {/* Reply form */}
      {replying &&
      <div className="ml-6">
          <ReplyForm group={group} parentId={comment._id} onDone={() => setReplying(false)} />
        </div>
      }

      {/* Replies */}
      <AnimatePresence>
        {showReplies && replies && replies.length > 0 &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-6 flex flex-col gap-2 overflow-hidden">
            {replies.map((reply) =>
          <div key={reply._id} className="bg-muted/50 border border-border/60 rounded-xl px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                      {reply.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{reply.authorName}</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                  </div>
                  {currentUserId === reply.authorId &&
              <button
                onClick={() => deleteComment({ commentId: reply._id }).catch(() => toast.error("Failed"))}
                className="text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
              }
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
                  {reply.content}
                </p>
              </div>
          )}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

// ── Main CommentSection ───────────────────────────────────────────────────────
function CommentSectionInner({
  group,
  title,
  description




}: {group: Group;title: string;description?: string;}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const comments = useQuery(api.comments.getComments, { group });
  const addComment = useMutation(api.comments.addComment);
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const currentUserId = currentUser?._id;

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await addComment({ group, content: trimmed });
      setText("");
      toast.success("Comment posted!");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as {message: string;};
        toast.error(message);
      } else {
        toast.error("Failed to post comment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h3>
          {description &&
          <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
              {description}
            </p>
          }
        </div>
      </div>

      {/* Compose box */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        





        
        
        








        
      </div>

      {/* Comments list */}
      <div className="flex flex-col gap-4">
        {comments === undefined &&
        <div className="space-y-3">
            {[1, 2, 3].map((i) =>
          <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          )}
          </div>
        }
        {comments?.length === 0 &&
        <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}>Comments section coming soon

          </p>
          </div>
        }
        {comments?.map((comment) =>
        <CommentItem
          key={comment._id}
          comment={comment}
          group={group}
          currentUserId={currentUserId} />

        )}
      </div>
    </div>);

}

export default function CommentSection({
  group,
  title,
  description




}: {group: Group;title: string;description?: string;}) {
  return (
    <>
      <Authenticated>
        <CommentSectionInner group={group} title={title} description={description} />
      </Authenticated>
      <Unauthenticated>
        <CommentSectionUnauthenticated group={group} title={title} description={description} />
      </Unauthenticated>
    </>);

}

// Unauthenticated view — can read but not post
function CommentSectionUnauthenticated({
  group,
  title,
  description




}: {group: Group;title: string;description?: string;}) {
  const comments = useQuery(api.comments.getComments, { group });

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h3>
          {description &&
          <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem" }}>
              {description}
            </p>
          }
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
          Sign in to join the conversation
        </p>
        <SignInButton className="flex-shrink-0 h-8 px-4 text-xs" />
      </div>
      <div className="flex flex-col gap-4">
        {comments === undefined &&
        <div className="space-y-3">
            {[1, 2, 3].map((i) =>
          <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          )}
          </div>
        }
        {comments?.length === 0 &&
        <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}>No comments yet.</p>
          </div>
        }
        {comments?.map((comment) =>
        <CommentItem key={comment._id} comment={comment} group={group} />
        )}
      </div>
    </div>);

}
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle, Send, Hash, Users, Smile, Trash2, Feather,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const QUICK_EMOJIS = ["❤️", "🔥", "😂", "👀", "💀", "✨", "🙏", "💯"];

export default function VivePage() {
  const chambers = useQuery(api.chambers.list, {});
  const seedChambers = useMutation(api.chambers.seedDefaults);
  const [activeChamber, setActiveChamber] = useState<Id<"chambers"> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    seedChambers().catch(() => {/* already seeded */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select first chamber
  useEffect(() => {
    if (chambers && chambers.length > 0 && !activeChamber) {
      setActiveChamber(chambers[0]._id);
    }
  }, [chambers, activeChamber]);

  const activeChamberData = chambers?.find((c) => c._id === activeChamber);

  return (
    <div className="h-screen flex flex-col text-foreground overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 backdrop-blur-md bg-background/80 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Feather className="w-4 h-4 text-primary" />
            <span
              className="text-sm font-bold tracking-widest text-primary uppercase"
              style={{ fontFamily: "'Cinzel Decorative', serif", letterSpacing: "0.1em" }}
            >
              Vive
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer hover:text-foreground"
          >
            <Users className="w-4 h-4" /> Chambers
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — chamber list */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-64 border-r border-border/50 bg-card/50 flex flex-col flex-shrink-0 absolute md:relative z-10 h-full md:h-auto"
            >
              <div className="px-4 py-4 border-b border-border/50">
                <h2
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Chambers
                </h2>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {!chambers && (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                )}
                {chambers?.map((chamber) => (
                  <button
                    key={chamber._id}
                    onClick={() => { setActiveChamber(chamber._id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                      activeChamber === chamber._id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{chamber.icon}</span>
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{chamber.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{chamber.description}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeChamber && activeChamberData ? (
            <>
              {/* Chamber header */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3 flex-shrink-0">
                <Hash className="w-4 h-4 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{activeChamberData.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{activeChamberData.description}</p>
                </div>
              </div>

              {/* Messages */}
              <ChatMessages chamberId={activeChamber} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a chamber to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Chat Messages Component ────────────────────────────────────────────────

function ChatMessages({ chamberId }: { chamberId: Id<"chambers"> }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.chambers.getMessages,
    { chamberId },
    { initialNumItems: 30 }
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Messages come in descending order, reverse for display
  const messages = [...(results ?? [])].reverse();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);

    // Load more when scrolled to top
    if (scrollTop < 50 && status === "CanLoadMore") {
      loadMore(20);
    }
  };

  return (
    <>
      {/* Message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {status === "LoadingFirstPage" && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {status === "LoadingMore" && (
          <div className="text-center py-2">
            <Skeleton className="h-4 w-32 mx-auto rounded" />
          </div>
        )}

        {messages.length === 0 && status !== "LoadingFirstPage" && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}
      </div>

      {/* Input area */}
      <Authenticated>
        <MessageInput chamberId={chamberId} />
      </Authenticated>
      <Unauthenticated>
        <div className="px-4 py-4 border-t border-border/50 bg-card/50 text-center">
          <p className="text-sm text-muted-foreground mb-2">Sign in to join the conversation</p>
          <SignInButton className="h-9 px-6" />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <Skeleton className="h-14 mx-4 mb-4 rounded-xl" />
      </AuthLoading>
    </>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

type MessageWithReactions = {
  _id: Id<"chamberMessages">;
  _creationTime: number;
  chamberId: Id<"chambers">;
  authorId: Id<"users">;
  authorName: string;
  content: string;
  createdAt: string;
  reactions: { emoji: string; count: number; userIds: string[] }[];
};

function MessageBubble({ message }: { message: MessageWithReactions }) {
  const [showEmojis, setShowEmojis] = useState(false);
  const toggleReaction = useMutation(api.chambers.toggleReaction);
  const deleteMessage = useMutation(api.chambers.deleteMessage);

  const handleReaction = async (emoji: string) => {
    try {
      await toggleReaction({ messageId: message._id, emoji });
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error((error.data as { message: string }).message);
      }
    }
    setShowEmojis(false);
  };

  const handleDelete = async () => {
    try {
      await deleteMessage({ messageId: message._id });
      toast.success("Message deleted");
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error((error.data as { message: string }).message);
      }
    }
  };

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  // Generate avatar initials
  const initials = message.authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Generate a consistent color from name
  const hue = message.authorName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
        style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{message.authorName}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 break-words whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((data) => (
              <button
                key={data.emoji}
                onClick={() => handleReaction(data.emoji)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <span>{data.emoji}</span>
                <span className="text-primary font-medium">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <Authenticated>
        <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setShowEmojis((v) => !v)}
            className="p-1.5 rounded hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-destructive/10 cursor-pointer text-muted-foreground hover:text-destructive"
            title="Delete (own only)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </Authenticated>

      {/* Emoji picker popup */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-4 mt-8 bg-card border border-border rounded-xl shadow-xl p-2 z-30 flex gap-1"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-lg cursor-pointer transition-transform hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Message Input ──────────────────────────────────────────────────────────

function MessageInput({ chamberId }: { chamberId: Id<"chambers"> }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const sendMessage = useMutation(api.chambers.sendMessage);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({ chamberId, content: text });
      setText("");
      inputRef.current?.focus();
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error((error.data as { message: string }).message);
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border/50 bg-card/50 flex-shrink-0">
      <div className="flex items-end gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32 min-h-[20px]"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="cursor-pointer h-8 w-8 p-0 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

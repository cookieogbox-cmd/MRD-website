import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Trash2, UploadCloud, ShieldOff, ArrowUp, ArrowDown, PlusIcon, X, Check, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { ConvexError } from "convex/values";

const ADMIN_EMAILS = ["thenewblacklinedynasty@gmail.com", "cookieogbox@gmail.com"];

const LANGUAGES = [
  "English (With Subtitles)",
  "English (No Subtitles)",
  "Spanish",
  "French",
  "Arabic",
  "Chinese",
  "Hindi",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "German",
  "Vietnamese",
  "Indonesian",
  "Bengali",
  "Urdu",
  "Zulu",
  "Swahili",
];

type ChapterStatus = "free" | "coming" | "paid";

type ChapterForm = {
  number: string;
  title: string;
  subtitle: string;
  synopsis: string;
  cover: string;
  status: ChapterStatus;
  price: string;
  minutes: string;
  tags: string;
  arc: string;
  langCount: string;
  seriesColor: string;
};

const EMPTY_CHAPTER: ChapterForm = {
  number: "",
  title: "",
  subtitle: "Scar-heart Malka Raurah",
  synopsis: "",
  cover: "",
  status: "coming",
  price: "",
  minutes: "44",
  tags: "Magic",
  arc: "Arc I — The Forgetting",
  langCount: "18",
  seriesColor: "",
};

// ── Chapter Manager ──────────────────────────────────────────────────────────
function ChapterManager() {
  const chapters = useQuery(api.chapters.list, {});
  const createChapter = useMutation(api.chapters.create);
  const updateChapter = useMutation(api.chapters.update);
  const removeChapter = useMutation(api.chapters.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"chapters"> | null>(null);
  const [form, setForm] = useState<ChapterForm>(EMPTY_CHAPTER);
  const [saving, setSaving] = useState(false);

  const setField = (f: keyof ChapterForm, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    setEditingId(null);
    const nextNum = String((chapters?.length ?? 0) + 1).padStart(2, "0");
    setForm({ ...EMPTY_CHAPTER, number: nextNum, title: `Chapter ${(chapters?.length ?? 0) + 1}` });
    setShowForm(true);
  };

  const openEdit = (c: NonNullable<typeof chapters>[number]) => {
    setEditingId(c._id);
    setForm({
      number: c.number,
      title: c.title,
      subtitle: c.subtitle,
      synopsis: c.synopsis,
      cover: c.cover ?? "",
      status: c.status,
      price: c.price ? String(c.price) : "",
      minutes: String(c.minutes),
      tags: c.tags.join(", "),
      arc: c.arc,
      langCount: String(c.langCount),
      seriesColor: c.seriesColor ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.number.trim() || !form.title.trim() || !form.synopsis.trim()) {
      toast.error("Number, title, and synopsis are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        number: form.number.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        synopsis: form.synopsis.trim(),
        cover: form.cover.trim() || undefined,
        status: form.status,
        price: form.price ? Number(form.price) : undefined,
        minutes: Number(form.minutes) || 44,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        arc: form.arc.trim(),
        langCount: Number(form.langCount) || 18,
        seriesColor: form.seriesColor.trim() || undefined,
        order: editingId ? (chapters?.find((c) => c._id === editingId)?.order ?? 1) : (chapters?.length ?? 0) + 1,
      };
      if (editingId) {
        const { number: _n, order: _o, ...updateFields } = payload;
        await updateChapter({ id: editingId, ...updateFields });
        toast.success("Chapter updated!");
      } else {
        await createChapter(payload);
        toast.success("Chapter created!");
      }
      setShowForm(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"chapters">) => {
    try {
      await removeChapter({ id });
      toast.success("Chapter removed.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const statusColor: Record<ChapterStatus, string> = {
    free: "bg-amber-500/20 text-amber-400",
    coming: "bg-muted text-muted-foreground",
    paid: "bg-primary/20 text-primary",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Chapter Manager</h2>
          <p className="text-sm text-muted-foreground">Manage chapters shown on the Episodes page</p>
        </div>
        <Button onClick={openCreate} className="gap-2" size="sm">
          <PlusIcon className="w-4 h-4" /> Add Chapter
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Chapter" : "New Chapter"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Number *</label>
                <Input placeholder="01" value={form.number} onChange={(e) => setField("number", e.target.value)} disabled={!!editingId} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input placeholder="Chapter 1" value={form.title} onChange={(e) => setField("title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free / Open</SelectItem>
                    <SelectItem value="coming">Coming Soon</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subtitle</label>
              <Input placeholder="Scar-heart Malka Raurah · Chapter 1" value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Synopsis *</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
                placeholder="Brief description for readers..."
                value={form.synopsis}
                onChange={(e) => setField("synopsis", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Price (USD) {form.status === "paid" ? "*" : "(optional)"}</label>
                <Input placeholder="4.99" type="number" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Minutes</label>
                <Input placeholder="44" type="number" value={form.minutes} onChange={(e) => setField("minutes", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Language Count</label>
                <Input placeholder="18" type="number" value={form.langCount} onChange={(e) => setField("langCount", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input placeholder="Magic, Memory, Origin" value={form.tags} onChange={(e) => setField("tags", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Arc</label>
                <Input placeholder="Arc I — The Forgetting" value={form.arc} onChange={(e) => setField("arc", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Series / Color Name (optional)</label>
              <Input placeholder="e.g. MRD Green, MRD Purple, Scar-heart Malka Raurah" value={form.seriesColor} onChange={(e) => setField("seriesColor", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cover Image URL (optional)</label>
              <Input placeholder="https://hercules-cdn.com/file_..." value={form.cover} onChange={(e) => setField("cover", e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Chapter"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {chapters === undefined ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No chapters yet. Click "Add Chapter" to create one.</div>
      ) : (
        <div className="space-y-3">
          {chapters.map((ch) => (
            <Card key={ch._id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{ch.number}</span>
              </div>
              {ch.cover && <img src={ch.cover} alt={ch.title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{ch.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[ch.status]}`}>
                    {ch.status === "free" ? "Free / Open" : ch.status === "paid" ? `Paid${ch.price ? ` — $${ch.price.toFixed(2)}` : ""}` : "Coming Soon"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{ch.subtitle}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openEdit(ch)}><Pencil className="w-3 h-3" /> Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ch._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page Upload Manager ───────────────────────────────────────────────────────
function PageUploadManager() {
  const chapters = useQuery(api.chapters.list, {});
  const [episodeNumber, setEpisodeNumber] = useState("01");
  const [language, setLanguage] = useState("English (With Subtitles)");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pages = useQuery(api.episodePages.listPages, { episodeNumber, language });
  const generateUploadUrl = useMutation(api.episodePages.generateUploadUrl);
  const addPage = useMutation(api.episodePages.addPage);
  const deletePage = useMutation(api.episodePages.deletePage);
  const reorderPage = useMutation(api.episodePages.reorderPage);

  // Build episode list from DB chapters or fallback
  const episodeOptions = (chapters && chapters.length > 0)
    ? chapters.map((c) => ({ number: c.number, label: `${c.number} — ${c.seriesColor || c.title}` }))
    : [{ number: "01", label: "01 — Book 1" }, { number: "02", label: "02 — Book 2" }];

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const startOrder = (pages?.length ?? 0) + 1;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json() as { storageId: Id<"_storage"> };
        await addPage({ episodeNumber, language, storageId, order: startOrder + i });
      }
      toast.success(`${files.length} page${files.length > 1 ? "s" : ""} uploaded!`);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: Id<"episodePages">) => {
    try {
      await deletePage({ id });
      toast.success("Page deleted.");
    } catch {
      toast.error("Failed to delete page.");
    }
  };

  const handleMove = async (id: Id<"episodePages">, currentOrder: number, direction: "up" | "down") => {
    if (!pages) return;
    const sorted = [...pages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p._id === id);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const swapWith = sorted[newIdx];
    await reorderPage({ id, newOrder: swapWith.order });
    await reorderPage({ id: swapWith._id, newOrder: currentOrder });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Page Upload Manager</h2>
        <p className="text-sm text-muted-foreground">Upload PNG pages for each chapter and language version</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1 flex-1 min-w-[160px]">
          <label className="text-sm font-medium">Chapter</label>
          <Select value={episodeNumber} onValueChange={setEpisodeNumber}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {episodeOptions.map((ep) => (
                <SelectItem key={ep.number} value={ep.number}>{ep.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Language Version</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
      >
        <UploadCloud className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Click or drag & drop PNG files here</p>
        <p className="text-xs text-muted-foreground mt-1">Upload multiple pages at once — they{"'"}ll be added in order</p>
        {uploading && <p className="text-xs text-primary mt-2 font-medium">Uploading...</p>}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {pages === undefined ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No pages uploaded yet</p>
          <p className="text-sm mt-1">Upload PNG images above to add pages to this chapter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pages].sort((a, b) => a.order - b.order).map((page, idx, arr) => (
            <Card key={page._id} className="flex items-center gap-4 p-3">
              <span className="text-sm font-bold text-muted-foreground w-8 text-center">{idx + 1}</span>
              {page.url && <img src={page.url} alt={`Page ${idx + 1}`} className="h-20 w-14 object-cover rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Page {idx + 1}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" disabled={idx === 0} onClick={() => handleMove(page._id, page.order, "up")}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" disabled={idx === arr.length - 1} onClick={() => handleMove(page._id, page.order, "down")}><ArrowDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(page._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Episode Manager ───────────────────────────────────────────────────────────
type EpisodeStatus = "free" | "coming" | "locked";

type EpisodeForm = {
  number: string;
  title: string;
  subtitle: string;
  synopsis: string;
  cover: string;
  status: EpisodeStatus;
  price: string;
  minutes: string;
  tags: string;
  arc: string;
  langCount: string;
  chapterGroup: string;
  tokenPrice: string;
  expiryDays: string;
  languages: string[];
};

const EMPTY_EPISODE: EpisodeForm = {
  number: "",
  title: "",
  subtitle: "",
  synopsis: "",
  cover: "",
  status: "coming",
  price: "",
  minutes: "44",
  tags: "Magic",
  arc: "Arc I — The Forgetting",
  langCount: "18",
  chapterGroup: "01",
  tokenPrice: "",
  expiryDays: "30",
  languages: [],
};

function EpisodeManager() {
  const episodes = useQuery(api.episodes.list, {});
  const chapters = useQuery(api.chapters.list, {});
  const createEpisode = useMutation(api.episodes.create);
  const updateEpisode = useMutation(api.episodes.update);
  const removeEpisode = useMutation(api.episodes.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<import("@/convex/_generated/dataModel.js").Id<"episodes"> | null>(null);
  const [form, setForm] = useState<EpisodeForm>(EMPTY_EPISODE);
  const [saving, setSaving] = useState(false);

  const setField = (f: keyof EpisodeForm, v: string | string[]) => setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    setEditingId(null);
    const nextNum = String((episodes?.length ?? 0) + 1).padStart(2, "0");
    setForm({ ...EMPTY_EPISODE, number: nextNum, title: `Episode ${(episodes?.length ?? 0) + 1}` });
    setShowForm(true);
  };

  const openEdit = (e: NonNullable<typeof episodes>[number]) => {
    setEditingId(e._id);
    setForm({
      number: e.number,
      title: e.title,
      subtitle: e.subtitle,
      synopsis: e.synopsis,
      cover: e.cover ?? "",
      status: e.status,
      price: e.price ? String(e.price) : "",
      minutes: String(e.minutes),
      tags: e.tags.join(", "),
      arc: e.arc,
      langCount: String(e.langCount),
      chapterGroup: e.chapterGroup,
      tokenPrice: e.tokenPrice ? String(e.tokenPrice) : "",
      expiryDays: e.expiryDays ? String(e.expiryDays) : "30",
      languages: e.languages ?? [],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.number.trim() || !form.title.trim() || !form.synopsis.trim()) {
      toast.error("Number, title, and synopsis are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        number: form.number.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        synopsis: form.synopsis.trim(),
        cover: form.cover.trim() || undefined,
        status: form.status,
        price: form.price ? Number(form.price) : undefined,
        minutes: Number(form.minutes) || 44,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        arc: form.arc.trim(),
        langCount: Number(form.langCount) || 18,
        languages: form.languages.length > 0 ? form.languages : undefined,
        chapterGroup: form.chapterGroup.trim() || "01",
        order: editingId ? (episodes?.find((e) => e._id === editingId)?.order ?? 1) : (episodes?.length ?? 0) + 1,
        tokenPrice: form.tokenPrice ? Number(form.tokenPrice) : undefined,
        expiryDays: form.expiryDays ? Number(form.expiryDays) : undefined,
      };
      if (editingId) {
        const { number: _n, order: _o, ...updateFields } = payload;
        await updateEpisode({ id: editingId, ...updateFields });
        toast.success("Episode updated!");
      } else {
        await createEpisode(payload);
        toast.success("Episode created!");
      }
      setShowForm(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: import("@/convex/_generated/dataModel.js").Id<"episodes">) => {
    try {
      await removeEpisode({ id });
      toast.success("Episode removed.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const statusColor: Record<EpisodeStatus, string> = {
    free: "bg-amber-500/20 text-amber-400",
    coming: "bg-muted text-muted-foreground",
    locked: "bg-primary/20 text-primary",
  };

  const chapterOptions = chapters?.map((c) => ({ value: c.number, label: `${c.number} — ${c.seriesColor || c.title}` })) ?? [{ value: "01", label: "01 — Book 1" }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Episode Manager</h2>
          <p className="text-sm text-muted-foreground">Manage individual episodes shown on the Episodes page</p>
        </div>
        <Button onClick={openCreate} className="gap-2" size="sm">
          <PlusIcon className="w-4 h-4" /> Add Episode
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Episode" : "New Episode"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Number *</label>
                <Input placeholder="01" value={form.number} onChange={(e) => setField("number", e.target.value)} disabled={!!editingId} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input placeholder="Episode 1" value={form.title} onChange={(e) => setField("title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free / Open</SelectItem>
                    <SelectItem value="coming">Coming Soon</SelectItem>
                    <SelectItem value="locked">Locked / Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subtitle</label>
              <Input placeholder="Scar-heart Malka Raurah · Episode 1" value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Synopsis *</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
                placeholder="Brief description for readers..."
                value={form.synopsis}
                onChange={(e) => setField("synopsis", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Book Series</label>
                <Select value={form.chapterGroup} onValueChange={(v) => setField("chapterGroup", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {chapterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Minutes</label>
                <Input placeholder="44" type="number" value={form.minutes} onChange={(e) => setField("minutes", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Language Count</label>
                <Input placeholder="18" type="number" value={form.langCount} onChange={(e) => setField("langCount", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input placeholder="Magic, Memory, Origin" value={form.tags} onChange={(e) => setField("tags", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Arc</label>
                <Input placeholder="Arc I — The Forgetting" value={form.arc} onChange={(e) => setField("arc", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Languages Available</label>
              <p className="text-xs text-muted-foreground">Select which languages this episode is available in</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {LANGUAGES.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.languages.includes(lang)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...form.languages, lang]
                          : form.languages.filter((l) => l !== lang);
                        setField("languages", updated);
                      }}
                      className="rounded border-border accent-primary"
                    />
                    {lang}
                  </label>
                ))}
              </div>
              {form.languages.length > 0 && (
                <p className="text-xs text-primary">{form.languages.length} language{form.languages.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cover Image URL (optional)</label>
              <Input placeholder="https://hercules-cdn.com/file_..." value={form.cover} onChange={(e) => setField("cover", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
              <div className="space-y-1">
                <label className="text-sm font-medium">Token Price (tokens to unlock)</label>
                <Input type="number" min="0" placeholder="e.g. 50 — leave blank if free" value={form.tokenPrice} onChange={(e) => setField("tokenPrice", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Access Duration (days after unlock)</label>
                <Input type="number" min="1" placeholder="e.g. 30" value={form.expiryDays} onChange={(e) => setField("expiryDays", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Episode"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {episodes === undefined ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No episodes yet. Click "Add Episode" to create one.</div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <Card key={ep._id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{ep.number}</span>
              </div>
              {ep.cover && <img src={ep.cover} alt={ep.title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{ep.title}</span>
                  <span className="text-xs text-muted-foreground">Series {ep.chapterGroup}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[ep.status]}`}>
                    {ep.status === "free" ? "Free" : ep.status === "locked" ? "Locked" : "Coming Soon"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{ep.subtitle}</p>
                {ep.languages && ep.languages.length > 0 && (
                  <p className="text-xs text-primary/70 mt-0.5">{ep.languages.length} lang{ep.languages.length !== 1 ? "s" : ""}: {ep.languages.slice(0, 3).join(", ")}{ep.languages.length > 3 ? "..." : ""}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openEdit(ep)}><Pencil className="w-3 h-3" /> Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ep._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
function EpisodePageManagerInner() {
  const [tab, setTab] = useState<"chapters" | "episodes" | "pages">("chapters");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Episode Admin</h1>
        <p className="text-sm text-muted-foreground">Manage chapters, episodes and upload story pages</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button variant={tab === "chapters" ? "default" : "ghost"} size="sm" onClick={() => setTab("chapters")}>Chapter Manager</Button>
          <Button variant={tab === "episodes" ? "default" : "ghost"} size="sm" onClick={() => setTab("episodes")}>Episode Manager</Button>
          <Button variant={tab === "pages" ? "default" : "ghost"} size="sm" onClick={() => setTab("pages")}>Page Upload Manager</Button>
        </div>

        {tab === "chapters" ? <ChapterManager /> : tab === "episodes" ? <EpisodeManager /> : <PageUploadManager />}
      </div>
    </div>
  );
}

function AdminGuard() {
  const { user } = useAuth();
  const email = user?.profile.email ?? "";
  if (!ADMIN_EMAILS.includes(email)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <ShieldOff className="w-12 h-12 text-destructive opacity-60" />
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">You don{"'"}t have permission to access this page.</p>
      </div>
    );
  }
  return <EpisodePageManagerInner />;
}

export default function EpisodeAdminPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-medium">Sign in to access the admin panel</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-12 w-48" />
        </div>
      </AuthLoading>
      <Authenticated>
        <AdminGuard />
      </Authenticated>
    </>
  );
}

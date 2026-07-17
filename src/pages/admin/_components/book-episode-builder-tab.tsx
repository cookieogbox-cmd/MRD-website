import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import {
  PlusIcon, Pencil, Trash2, X, Check, UploadCloud, BookOpen, Film,
  ArrowUp, ArrowDown, RefreshCw, Layers,
} from "lucide-react";
import { ConvexError } from "convex/values";

// LED reading-light presets (mirror of Book Studio).
const LIGHT_PRESETS = [
  { value: "red", label: "Magical Red", swatch: "#e23b4e" },
  { value: "purple", label: "Enchanted Purple", swatch: "#a855f7" },
  { value: "peacock-blue", label: "Peacock Blue", swatch: "#0e7c86" },
  { value: "phthalo-green", label: "Phthalo Green", swatch: "#123524" },
  { value: "gold", label: "Gold", swatch: "#d4af37" },
] as const;

type ScrollMode = "single" | "dual";
type SubtitleMode = "none" | "subtitled" | "both";
type Pricing = "free" | "locked" | "sale";

type Variant = {
  id: string;
  label: string;
  language: string;
  subtitled: boolean;
  pricing: Pricing;
  tokenPrice?: number;
  salePrice?: number;
  expiryDays?: number;
};

type EpisodeForm = {
  number: string;
  title: string;
  subtitle: string;
  synopsis: string;
  cover: string;
  coverStorageId: Id<"_storage"> | null;
  coverPreview: string;
  minutes: string;
  arc: string;
  tags: string;
  scrollMode: ScrollMode;
  subtitleMode: SubtitleMode;
  defaultLight: string;
  baseLikes: string;
  baseReaders: string;
  readerCadence: "hourly" | "daily" | "weekly";
  variants: Variant[];
};

const EMPTY_EPISODE: EpisodeForm = {
  number: "",
  title: "",
  subtitle: "",
  synopsis: "",
  cover: "",
  coverStorageId: null,
  coverPreview: "",
  minutes: "44",
  arc: "Arc I",
  tags: "Magic",
  scrollMode: "single",
  subtitleMode: "subtitled",
  defaultLight: "gold",
  baseLikes: "0",
  baseReaders: "0",
  readerCadence: "daily",
  variants: [],
};

function makeVariantId(language: string, subtitled: boolean) {
  return `${subtitled ? "sub" : "nosub"}-${language.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
}

function variantLabel(language: string, subtitled: boolean) {
  return `${language} · ${subtitled ? "Subtitled" : "No subtitles"}`;
}

// ── Page manager for a single variant (continuous scroll) ──────────────────────
function VariantPageManager({
  episodeNumber,
  bookId,
  variant,
}: {
  episodeNumber: string;
  bookId: Id<"books">;
  variant: Variant;
}) {
  const pages = useQuery(api.episodePages.listByVariant, { episodeNumber, variantId: variant.id });
  const generateUploadUrl = useMutation(api.episodePages.generateUploadUrl);
  const addPage = useMutation(api.episodePages.addPage);
  const deletePage = useMutation(api.episodePages.deletePage);
  const reorderPage = useMutation(api.episodePages.reorderPage);
  const replacePage = useMutation(api.episodePages.replacePage);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<Id<"episodePages"> | null>(null);

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
    return storageId;
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const startOrder = (pages?.length ?? 0) + 1;
    try {
      for (let i = 0; i < files.length; i++) {
        const storageId = await uploadFile(files[i]);
        await addPage({
          episodeNumber,
          language: variant.language,
          storageId,
          order: startOrder + i,
          bookId,
          variantId: variant.id,
        });
      }
      toast.success(`${files.length} page${files.length > 1 ? "s" : ""} uploaded!`);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReplace = async (files: FileList | null) => {
    if (!files || files.length === 0 || !replacingId) return;
    try {
      const storageId = await uploadFile(files[0]);
      await replacePage({ id: replacingId, storageId });
      toast.success("Page replaced!");
    } catch {
      toast.error("Replace failed. Please try again.");
    } finally {
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
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
    <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{variant.label}</span>
          <Badge variant="secondary" className="text-[10px]">{pages?.length ?? 0} pages</Badge>
        </div>
      </div>

      <div
        className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
      >
        <UploadCloud className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">Click or drag pages here</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">They read as one continuous scroll, in order.</p>
        {uploading && <p className="text-[11px] text-primary mt-1 font-medium">Uploading...</p>}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {/* hidden input used for single-page replacement */}
      <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReplace(e.target.files)} />

      {pages === undefined ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : pages.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No pages yet for this scroll.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[...pages].sort((a, b) => a.order - b.order).map((page, idx, arr) => (
            <div key={page._id} className="relative group rounded-lg overflow-hidden border border-border bg-background">
              {page.url && <img src={page.url} alt={`Page ${idx + 1}`} className="w-full h-24 object-cover" />}
              <span className="absolute top-1 left-1 text-[10px] font-bold bg-background/80 rounded px-1">{idx + 1}</span>
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-background/85 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMove(page._id, page.order, "up")}><ArrowUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === arr.length - 1} onClick={() => handleMove(page._id, page.order, "down")}><ArrowDown className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Replace" onClick={() => { setReplacingId(page._id); replaceInputRef.current?.click(); }}><RefreshCw className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePage({ id: page._id }).then(() => toast.success("Page deleted.")).catch(() => toast.error("Failed."))}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main: Per-Book Episode Builder ─────────────────────────────────────────────
export default function BookEpisodeBuilderTab() {
  const books = useQuery(api.books.list, {});
  const [selectedBookId, setSelectedBookId] = useState<Id<"books"> | "">("");

  const effectiveBookId: Id<"books"> | "" =
    selectedBookId || (books && books.length > 0 ? books[0]._id : "");

  const episodes = useQuery(
    api.episodes.listByBook,
    effectiveBookId ? { bookId: effectiveBookId } : "skip"
  );

  const createEpisode = useMutation(api.episodes.create);
  const updateEpisode = useMutation(api.episodes.update);
  const removeEpisode = useMutation(api.episodes.remove);
  const generateUploadUrl = useMutation(api.episodePages.generateUploadUrl);
  const getStorageUrl = useMutation(api.episodePages.getUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"episodes"> | null>(null);
  const [editingNumber, setEditingNumber] = useState<string>("");
  const [form, setForm] = useState<EpisodeForm>(EMPTY_EPISODE);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selectedBook = books?.find((b) => b._id === effectiveBookId);
  const bookLanguages = selectedBook?.languages ?? ["English"];

  const setField = <K extends keyof EpisodeForm>(f: K, v: EpisodeForm[K]) =>
    setForm((p) => ({ ...p, [f]: v }));

  const openCreate = () => {
    if (!effectiveBookId) return;
    setEditingId(null);
    setEditingNumber("");
    const nextNum = String((episodes?.length ?? 0) + 1).padStart(2, "0");
    setForm({
      ...EMPTY_EPISODE,
      number: nextNum,
      title: `Episode ${(episodes?.length ?? 0) + 1}`,
      defaultLight: selectedBook?.defaultLight ?? "gold",
      baseLikes: String(selectedBook?.baseLikes ?? 0),
      baseReaders: String(selectedBook?.baseReaders ?? 0),
      readerCadence: selectedBook?.readerCadence ?? "daily",
      variants: [
        {
          id: makeVariantId(bookLanguages[0], true),
          label: variantLabel(bookLanguages[0], true),
          language: bookLanguages[0],
          subtitled: true,
          pricing: "free",
        },
      ],
    });
    setShowForm(true);
  };

  const openEdit = (e: NonNullable<typeof episodes>[number]) => {
    setEditingId(e._id);
    setEditingNumber(e.number);
    setForm({
      number: e.number,
      title: e.title,
      subtitle: e.subtitle,
      synopsis: e.synopsis,
      cover: e.cover ?? "",
      coverStorageId: null,
      coverPreview: e.cover ?? "",
      minutes: String(e.minutes),
      arc: e.arc,
      tags: e.tags.join(", "),
      scrollMode: e.scrollMode ?? "single",
      subtitleMode: e.subtitleMode ?? "subtitled",
      defaultLight: e.defaultLight ?? selectedBook?.defaultLight ?? "gold",
      baseLikes: String(e.baseLikes ?? 0),
      baseReaders: String(e.baseReaders ?? 0),
      readerCadence: e.readerCadence ?? "daily",
      variants: e.variants ?? [],
    });
    setShowForm(true);
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
    return storageId;
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const storageId = await uploadFile(file);
      const url = await getStorageUrl({ storageId });
      setForm((prev) => ({ ...prev, coverStorageId: storageId, cover: url ?? "", coverPreview: URL.createObjectURL(file) }));
      toast.success("Cover uploaded!");
    } catch {
      toast.error("Cover upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  const addVariant = () => {
    const lang = bookLanguages[0];
    const subtitled = form.subtitleMode !== "none";
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        {
          id: makeVariantId(lang, subtitled),
          label: variantLabel(lang, subtitled),
          language: lang,
          subtitled,
          pricing: "free",
        },
      ],
    }));
  };

  const updateVariant = (id: string, patch: Partial<Variant>) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.map((vrt) => {
        if (vrt.id !== id) return vrt;
        const merged = { ...vrt, ...patch };
        merged.label = variantLabel(merged.language, merged.subtitled);
        return merged;
      }),
    }));
  };

  const removeVariant = (id: string) => {
    setForm((p) => ({ ...p, variants: p.variants.filter((vrt) => vrt.id !== id) }));
  };

  const handleSave = async () => {
    if (!effectiveBookId) {
      toast.error("Pick a book first.");
      return;
    }
    if (!form.number.trim() || !form.title.trim() || !form.synopsis.trim()) {
      toast.error("Number, title, and synopsis are required.");
      return;
    }
    if (form.variants.length === 0) {
      toast.error("Add at least one scroll variant.");
      return;
    }
    setSaving(true);
    try {
      // Determine overall episode status from the cheapest variant.
      const anyFree = form.variants.some((vrt) => vrt.pricing === "free");
      const status: "free" | "locked" = anyFree ? "free" : "locked";
      const minToken = Math.min(
        ...form.variants
          .filter((vrt) => vrt.pricing !== "free")
          .map((vrt) => (vrt.pricing === "sale" ? vrt.salePrice ?? vrt.tokenPrice ?? 0 : vrt.tokenPrice ?? 0))
      );

      const cleanVariants: Variant[] = form.variants.map((vrt) => ({
        id: vrt.id,
        label: vrt.label,
        language: vrt.language,
        subtitled: vrt.subtitled,
        pricing: vrt.pricing,
        tokenPrice: vrt.pricing === "free" ? undefined : vrt.tokenPrice,
        salePrice: vrt.pricing === "sale" ? vrt.salePrice : undefined,
        expiryDays: vrt.pricing === "free" ? undefined : vrt.expiryDays,
      }));

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        synopsis: form.synopsis.trim(),
        cover: form.cover.trim() || undefined,
        status,
        minutes: Number(form.minutes) || 44,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        arc: form.arc.trim(),
        langCount: new Set(cleanVariants.map((vrt) => vrt.language)).size,
        languages: Array.from(new Set(cleanVariants.map((vrt) => vrt.language))),
        chapterGroup: form.number.trim(),
        tokenPrice: status === "locked" && Number.isFinite(minToken) ? minToken : undefined,
        bookId: effectiveBookId,
        scrollMode: form.scrollMode,
        subtitleMode: form.subtitleMode,
        defaultLight: form.defaultLight,
        baseLikes: Number(form.baseLikes) || 0,
        baseReaders: Number(form.baseReaders) || 0,
        readerCadence: form.readerCadence,
        variants: cleanVariants,
      };

      if (editingId) {
        await updateEpisode({ id: editingId, ...payload });
        toast.success("Episode updated!");
      } else {
        await createEpisode({
          ...payload,
          number: form.number.trim(),
          order: (episodes?.length ?? 0) + 1,
        });
        toast.success("Episode created! Reopen it to upload pages.");
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

  const handleDelete = async (id: Id<"episodes">) => {
    try {
      await removeEpisode({ id });
      toast.success("Episode removed.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Book picker */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="space-y-1 flex-1">
          <label className="text-sm font-medium">Editing episodes for</label>
          {books === undefined ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={effectiveBookId || "none"} onValueChange={(v) => setSelectedBookId(v === "none" ? "" : (v as Id<"books">))}>
              <SelectTrigger><SelectValue placeholder="Choose a book…" /></SelectTrigger>
              <SelectContent>
                {books.length === 0 && <SelectItem value="none" disabled>No books yet — create one in Book Studio</SelectItem>}
                {books.map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.title}{b.isFlagship ? " ★" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {effectiveBookId && !showForm && (
          <Button onClick={openCreate} className="gap-2 flex-shrink-0">
            <PlusIcon className="w-4 h-4" /> New Episode
          </Button>
        )}
      </div>

      {!effectiveBookId ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
            <EmptyTitle>No book selected</EmptyTitle>
            <EmptyDescription>Create a book in Book Studio, then come back to build its episodes.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {showForm && (
            <Card className="border-2 border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{editingId ? `Edit Episode ${editingNumber}` : "New Episode"}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Basics */}
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
                    <label className="text-sm font-medium">Minutes</label>
                    <Input type="number" value={form.minutes} onChange={(e) => setField("minutes", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Subtitle</label>
                  <Input placeholder="Chapter subtitle…" value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Synopsis *</label>
                  <Textarea rows={3} placeholder="Brief description for readers…" value={form.synopsis} onChange={(e) => setField("synopsis", e.target.value)} />
                </div>

                {/* Cover */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Episode Cover (any image format)</label>
                  {form.coverPreview && (
                    <div className="relative inline-block">
                      <img src={form.coverPreview} alt="cover" className="h-32 rounded-lg object-cover border" />
                      <button type="button" onClick={() => setForm((p) => ({ ...p, cover: "", coverStorageId: null, coverPreview: "" }))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  <div className="flex gap-2 items-center flex-wrap">
                    <Button type="button" variant="secondary" className="gap-2" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
                      <UploadCloud className="w-4 h-4" />{uploadingCover ? "Uploading..." : "Upload Cover"}
                    </Button>
                    <span className="text-xs text-muted-foreground">or paste a URL</span>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ""; }} />
                  {!form.coverStorageId && (
                    <Input placeholder="https://hercules-cdn.com/file_..." value={form.cover} onChange={(e) => { setField("cover", e.target.value); setField("coverPreview", e.target.value); }} />
                  )}
                </div>

                {/* Scroll + subtitle + light */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Scrolls</label>
                    <Select value={form.scrollMode} onValueChange={(v) => setField("scrollMode", v as ScrollMode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">One scroll</SelectItem>
                        <SelectItem value="dual">Two scrolls</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Subtitles</label>
                    <Select value={form.subtitleMode} onValueChange={(v) => setField("subtitleMode", v as SubtitleMode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtitled">Subtitled</SelectItem>
                        <SelectItem value="both">Both options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Default Reading Light</label>
                    <Select value={form.defaultLight} onValueChange={(v) => setField("defaultLight", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LIGHT_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Likes & reader counts */}
                <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/10">
                  <div>
                    <label className="text-sm font-medium">Likes &amp; Readers</label>
                    <p className="text-xs text-muted-foreground">Seeded numbers shown to readers. Real likes add on top of the base count.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Base likes (e.g. 88000)</label>
                      <Input type="number" min="0" placeholder="88000" value={form.baseLikes} onChange={(e) => setField("baseLikes", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Reader estimate</label>
                      <Input type="number" min="0" placeholder="12000" value={form.baseReaders} onChange={(e) => setField("baseReaders", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Reader cadence</label>
                      <Select value={form.readerCadence} onValueChange={(v) => setField("readerCadence", v as EpisodeForm["readerCadence"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Per hour</SelectItem>
                          <SelectItem value="daily">Per day</SelectItem>
                          <SelectItem value="weekly">Per week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Variants */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Scroll Variants &amp; Pricing</label>
                      <p className="text-xs text-muted-foreground">Each variant is a language/subtitle version readers can unlock.</p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" className="gap-1" onClick={addVariant}><PlusIcon className="w-3 h-3" /> Add Variant</Button>
                  </div>

                  {form.variants.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No variants yet. Add at least one.</p>
                  ) : (
                    <div className="space-y-3">
                      {form.variants.map((vrt) => (
                        <div key={vrt.id} className="rounded-lg border border-border p-3 space-y-3 bg-muted/10">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Language</label>
                              <Select value={vrt.language} onValueChange={(v) => updateVariant(vrt.id, { language: v })}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {bookLanguages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Subtitles</label>
                              <Select value={vrt.subtitled ? "yes" : "no"} onValueChange={(v) => updateVariant(vrt.id, { subtitled: v === "yes" })}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Subtitled</SelectItem>
                                  <SelectItem value="no">No subtitles</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Pricing</label>
                              <Select value={vrt.pricing} onValueChange={(v) => updateVariant(vrt.id, { pricing: v as Pricing })}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="locked">Locked (tokens)</SelectItem>
                                  <SelectItem value="sale">On Sale</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => removeVariant(vrt.id)}>
                                <Trash2 className="w-3 h-3" /> Remove
                              </Button>
                            </div>
                          </div>

                          {vrt.pricing !== "free" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">{vrt.pricing === "sale" ? "Original tokens" : "Tokens to unlock"}</label>
                                <Input type="number" min="0" placeholder="e.g. 50" value={vrt.tokenPrice ?? ""} onChange={(e) => updateVariant(vrt.id, { tokenPrice: e.target.value ? Number(e.target.value) : undefined })} />
                              </div>
                              {vrt.pricing === "sale" && (
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-muted-foreground">Sale tokens</label>
                                  <Input type="number" min="0" placeholder="e.g. 30" value={vrt.salePrice ?? ""} onChange={(e) => updateVariant(vrt.id, { salePrice: e.target.value ? Number(e.target.value) : undefined })} />
                                </div>
                              )}
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Access days</label>
                                <Input type="number" min="1" placeholder="30" value={vrt.expiryDays ?? ""} onChange={(e) => updateVariant(vrt.id, { expiryDays: e.target.value ? Number(e.target.value) : undefined })} />
                              </div>
                            </div>
                          )}

                          {/* Pages — only available once the episode exists */}
                          {editingId ? (
                            <VariantPageManager episodeNumber={editingNumber} bookId={effectiveBookId} variant={vrt} />
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic">Save the episode first, then reopen it to upload pages for this scroll.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving || uploadingCover} className="gap-2">
                    <Check className="w-4 h-4" />{saving ? "Saving..." : editingId ? "Save Changes" : "Create Episode"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Episode list */}
          {episodes === undefined ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : episodes.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Film /></EmptyMedia>
                <EmptyTitle>No episodes in this book yet</EmptyTitle>
                <EmptyDescription>Create the first episode to start building this book.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" onClick={openCreate} className="gap-2"><PlusIcon className="w-4 h-4" /> New Episode</Button>
              </EmptyContent>
            </Empty>
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
                      <Badge variant="secondary" className="text-[10px] capitalize">{ep.scrollMode === "dual" ? "2 scrolls" : "1 scroll"}</Badge>
                      {(ep.variants?.length ?? 0) > 0 && <Badge variant="secondary" className="text-[10px]">{ep.variants?.length} variant{(ep.variants?.length ?? 0) !== 1 ? "s" : ""}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ep.subtitle || ep.synopsis}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openEdit(ep)}><Pencil className="w-3 h-3" /> Edit</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ep._id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

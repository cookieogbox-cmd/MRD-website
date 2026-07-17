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
import { PlusIcon, Pencil, Trash2, X, Check, UploadIcon, BookOpen, Star, Infinity as InfinityIcon } from "lucide-react";
import { ConvexError } from "convex/values";

// Mirrors the LED presets defined on the backend.
const LED_PRESETS = [
  { value: "red", label: "Magical Red", swatch: "#e23b4e" },
  { value: "purple", label: "Enchanted Purple", swatch: "#a855f7" },
  { value: "peacock-blue", label: "Peacock Blue", swatch: "#0e7c86" },
  { value: "phthalo-green", label: "Phthalo Green", swatch: "#123524" },
  { value: "gold", label: "Gold", swatch: "#d4af37" },
] as const;

const LANGUAGE_OPTIONS = [
  "English", "Zulu", "Xhosa", "Afrikaans", "French", "Spanish",
  "Portuguese", "Swahili", "Arabic", "Mandarin", "Hindi", "German",
];

type PageCountMode = "number" | "neverending" | "unknown" | "infinite";
type BookStatus = "ongoing" | "complete";
type ReaderCadence = "hourly" | "daily" | "weekly";
type LedMode = "preset" | "custom";

type BookForm = {
  title: string;
  coverUrl: string;
  coverStorageId: Id<"_storage"> | null;
  coverPreview: string;
  languages: string[];
  synopsis: string;
  status: BookStatus;
  pageCountMode: PageCountMode;
  pageCount: string;
  ledColorMode: LedMode;
  ledColorPreset: string;
  ledColorCustomUrl: string;
  ledColorCustomStorageId: Id<"_storage"> | null;
  ledCustomPreview: string;
  realmId: string;
  defaultLight: string;
  baseLikes: string;
  baseReaders: string;
  readerCadence: ReaderCadence;
  isFlagship: boolean;
  published: boolean;
  order: string;
};

const EMPTY_BOOK: BookForm = {
  title: "",
  coverUrl: "",
  coverStorageId: null,
  coverPreview: "",
  languages: ["English"],
  synopsis: "",
  status: "ongoing",
  pageCountMode: "neverending",
  pageCount: "",
  ledColorMode: "preset",
  ledColorPreset: "gold",
  ledColorCustomUrl: "",
  ledColorCustomStorageId: null,
  ledCustomPreview: "",
  realmId: "",
  defaultLight: "gold",
  baseLikes: "88000",
  baseReaders: "88000",
  readerCadence: "daily",
  isFlagship: false,
  published: true,
  order: "1",
};

const PAGE_MODE_LABELS: Record<PageCountMode, string> = {
  number: "Exact number",
  neverending: "Neverending",
  unknown: "Unknown Yet",
  infinite: "∞ Infinite",
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${on ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

export default function BookStudioTab() {
  const books = useQuery(api.books.list, {});
  const realms = useQuery(api.realms.list, {});
  const createBook = useMutation(api.books.create);
  const updateBook = useMutation(api.books.update);
  const removeBook = useMutation(api.books.remove);
  const generateUploadUrl = useMutation(api.books.generateUploadUrl);
  const createRealm = useMutation(api.realms.create);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"books"> | null>(null);
  const [form, setForm] = useState<BookForm>(EMPTY_BOOK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ledUploading, setLedUploading] = useState(false);
  const [newRealmName, setNewRealmName] = useState("");
  const [addingRealm, setAddingRealm] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const ledInputRef = useRef<HTMLInputElement>(null);

  const handleField = <K extends keyof BookForm>(field: K, value: BookForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_BOOK,
      order: String((books?.length ?? 0) + 1),
      realmId: realms && realms.length > 0 ? realms[0]._id : "",
    });
    setShowForm(true);
  };

  const openEdit = (b: NonNullable<typeof books>[number]) => {
    setEditingId(b._id);
    setForm({
      title: b.title,
      coverUrl: b.coverStorageId ? "" : b.coverUrl ?? "",
      coverStorageId: b.coverStorageId ?? null,
      coverPreview: b.resolvedCoverUrl ?? "",
      languages: b.languages,
      synopsis: b.synopsis,
      status: b.status,
      pageCountMode: b.pageCountMode,
      pageCount: b.pageCount !== undefined ? String(b.pageCount) : "",
      ledColorMode: b.ledColorMode,
      ledColorPreset: b.ledColorPreset ?? "gold",
      ledColorCustomUrl: b.ledColorCustomStorageId ? "" : b.ledColorCustomUrl ?? "",
      ledColorCustomStorageId: null,
      ledCustomPreview: b.resolvedLedCustomUrl ?? "",
      realmId: b.realmId,
      defaultLight: b.defaultLight,
      baseLikes: String(b.baseLikes),
      baseReaders: String(b.baseReaders),
      readerCadence: b.readerCadence,
      isFlagship: b.isFlagship,
      published: b.published,
      order: String(b.order),
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
    setUploading(true);
    try {
      const storageId = await uploadFile(file);
      setForm((prev) => ({
        ...prev,
        coverStorageId: storageId,
        coverUrl: "",
        coverPreview: URL.createObjectURL(file),
      }));
      toast.success("Cover uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLedUpload = async (file: File) => {
    setLedUploading(true);
    try {
      const storageId = await uploadFile(file);
      setForm((prev) => ({
        ...prev,
        ledColorCustomStorageId: storageId,
        ledCustomPreview: URL.createObjectURL(file),
      }));
      toast.success("Custom LED uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setLedUploading(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleAddRealm = async () => {
    if (!newRealmName.trim()) {
      toast.error("Realm name is required.");
      return;
    }
    setAddingRealm(true);
    try {
      const realmId = await createRealm({ name: newRealmName.trim() });
      setForm((prev) => ({ ...prev, realmId }));
      setNewRealmName("");
      toast.success("Realm created!");
    } catch {
      toast.error("Could not create realm.");
    } finally {
      setAddingRealm(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Book title is required.");
      return;
    }
    if (!form.realmId) {
      toast.error("Please choose or create a realm.");
      return;
    }
    if (form.languages.length === 0) {
      toast.error("Pick at least one language.");
      return;
    }
    if (form.pageCountMode === "number" && (!form.pageCount || Number(form.pageCount) <= 0)) {
      toast.error("Enter a valid page count, or choose a symbol instead.");
      return;
    }

    setSaving(true);
    try {
      const isCustomLed = form.ledColorMode === "custom";
      const ledCustomUrlValue =
        isCustomLed && !form.ledColorCustomStorageId
          ? form.ledColorCustomUrl.trim() || undefined
          : undefined;

      const payload = {
        title: form.title.trim(),
        coverUrl: form.coverStorageId ? undefined : form.coverUrl.trim() || undefined,
        coverStorageId: form.coverStorageId ?? undefined,
        languages: form.languages,
        synopsis: form.synopsis.trim(),
        status: form.status,
        pageCountMode: form.pageCountMode,
        pageCount: form.pageCountMode === "number" ? Number(form.pageCount) : undefined,
        ledColorMode: form.ledColorMode,
        ledColorPreset: form.ledColorMode === "preset" ? form.ledColorPreset : undefined,
        ledColorCustomUrl: ledCustomUrlValue,
        ledColorCustomStorageId: isCustomLed ? form.ledColorCustomStorageId ?? undefined : undefined,
        realmId: form.realmId as Id<"realms">,
        defaultLight: form.defaultLight,
        baseLikes: Number(form.baseLikes) || 0,
        baseReaders: Number(form.baseReaders) || 0,
        readerCadence: form.readerCadence,
        isFlagship: form.isFlagship,
        published: form.published,
        order: Number(form.order) || 1,
      };

      if (editingId) {
        await updateBook({ id: editingId, ...payload });
        toast.success("Book updated!");
      } else {
        await createBook(payload);
        toast.success("Book created!");
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

  const realmName = (id: string) => realms?.find((r) => r._id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-lg">
          Create and manage every book in the universe. Set the cover, languages, synopsis, page-count symbol, LED color, realm, base likes &amp; readers, and pick which book is the flagship.
        </p>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <PlusIcon className="w-4 h-4" /> Create Book
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Book" : "Create New Book"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title + order */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input placeholder="e.g. Scar-heart Malka Raurah" value={form.title} onChange={(e) => handleField("title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Display Order</label>
                <Input type="number" min="1" value={form.order} onChange={(e) => handleField("order", e.target.value)} />
              </div>
            </div>

            {/* Cover */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Main Cover (any image format)</label>
              {form.coverPreview && (
                <div className="relative inline-block">
                  <img src={form.coverPreview} alt="Cover preview" className="h-40 rounded-lg object-cover border" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, coverStorageId: null, coverUrl: "", coverPreview: "" }))}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center flex-wrap">
                <Button type="button" variant="secondary" className="gap-2" disabled={uploading} onClick={() => coverInputRef.current?.click()}>
                  <UploadIcon className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Cover"}
                </Button>
                <span className="text-xs text-muted-foreground">or paste a URL below</span>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  e.target.value = "";
                }}
              />
              {!form.coverStorageId && (
                <Input
                  placeholder="https://hercules-cdn.com/file_..."
                  value={form.coverUrl}
                  onChange={(e) => {
                    handleField("coverUrl", e.target.value);
                    handleField("coverPreview", e.target.value);
                  }}
                />
              )}
            </div>

            {/* Synopsis */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Synopsis</label>
              <Textarea placeholder="What is this book about?" rows={3} value={form.synopsis} onChange={(e) => handleField("synopsis", e.target.value)} />
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Languages (appears in)</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const active = form.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status + page count */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => handleField("status", v as BookStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Page Count</label>
                <Select value={form.pageCountMode} onValueChange={(v) => handleField("pageCountMode", v as PageCountMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Exact number</SelectItem>
                    <SelectItem value="neverending">Neverending</SelectItem>
                    <SelectItem value="unknown">Unknown Yet</SelectItem>
                    <SelectItem value="infinite">∞ Infinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.pageCountMode === "number" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Number of Pages</label>
                  <Input type="number" min="1" placeholder="e.g. 320" value={form.pageCount} onChange={(e) => handleField("pageCount", e.target.value)} />
                </div>
              )}
            </div>

            {/* LED color */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mini-Scroll LED Color</label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={form.ledColorMode === "preset" ? "default" : "secondary"} onClick={() => handleField("ledColorMode", "preset")}>
                  Preset
                </Button>
                <Button type="button" size="sm" variant={form.ledColorMode === "custom" ? "default" : "secondary"} onClick={() => handleField("ledColorMode", "custom")}>
                  Custom upload
                </Button>
              </div>
              {form.ledColorMode === "preset" ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {LED_PRESETS.map((p) => {
                    const active = form.ledColorPreset === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleField("ledColorPreset", p.value)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          active ? "border-primary ring-2 ring-primary/30" : "border-input"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.swatch }} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {form.ledCustomPreview && (
                    <img src={form.ledCustomPreview} alt="LED preview" className="h-16 rounded-lg object-cover border" />
                  )}
                  <div className="flex gap-2 items-center flex-wrap">
                    <Button type="button" variant="secondary" className="gap-2" disabled={ledUploading} onClick={() => ledInputRef.current?.click()}>
                      <UploadIcon className="w-4 h-4" />
                      {ledUploading ? "Uploading..." : "Upload LED Texture"}
                    </Button>
                    <span className="text-xs text-muted-foreground">or paste a URL</span>
                  </div>
                  <input
                    ref={ledInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLedUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Input
                    placeholder="https://hercules-cdn.com/file_..."
                    value={form.ledColorCustomUrl}
                    onChange={(e) => {
                      handleField("ledColorCustomUrl", e.target.value);
                      handleField("ledCustomPreview", e.target.value);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Realm */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Realm *</label>
              <Select value={form.realmId || "none"} onValueChange={(v) => handleField("realmId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Choose a realm…" /></SelectTrigger>
                <SelectContent>
                  {(realms ?? []).length === 0 && <SelectItem value="none" disabled>No realms yet — create one below</SelectItem>}
                  {(realms ?? []).map((r) => (
                    <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 items-center">
                <Input placeholder="New realm name (e.g. Zulu Realm)" value={newRealmName} onChange={(e) => setNewRealmName(e.target.value)} />
                <Button type="button" variant="secondary" disabled={addingRealm} onClick={handleAddRealm} className="gap-1 flex-shrink-0">
                  <PlusIcon className="w-4 h-4" /> Add Realm
                </Button>
              </div>
            </div>

            {/* Default light */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Default Reading Light</label>
              <Select value={form.defaultLight} onValueChange={(v) => handleField("defaultLight", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LED_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base likes + readers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Base Likes</label>
                <Input type="number" min="0" value={form.baseLikes} onChange={(e) => handleField("baseLikes", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Base Readers</label>
                <Input type="number" min="0" value={form.baseReaders} onChange={(e) => handleField("baseReaders", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Reader Cadence</label>
                <Select value={form.readerCadence} onValueChange={(v) => handleField("readerCadence", v as ReaderCadence)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flagship + published */}
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium flex items-center gap-1"><Star className="w-4 h-4" /> Flagship book</label>
                <Toggle on={form.isFlagship} onClick={() => handleField("isFlagship", !form.isFlagship)} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Published</label>
                <Toggle on={form.published} onClick={() => handleField("published", !form.published)} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || uploading || ledUploading} className="gap-2">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Book"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {books === undefined ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : books.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
            <EmptyTitle>No books yet</EmptyTitle>
            <EmptyDescription>Create your first book to start building the library.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openCreate} className="gap-2"><PlusIcon className="w-4 h-4" /> Create Book</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {books.map((b) => (
            <Card key={b._id} className="flex flex-row items-start gap-4 p-4">
              {b.resolvedCoverUrl ? (
                <button type="button" onClick={() => openEdit(b)} className="flex-shrink-0 cursor-pointer">
                  <img src={b.resolvedCoverUrl} alt={b.title} className="w-16 h-24 object-cover rounded-lg" />
                </button>
              ) : (
                <button type="button" onClick={() => openEdit(b)} className="w-16 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 cursor-pointer">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-foreground truncate">{b.title}</h3>
                  {b.isFlagship && <Badge className="gap-1"><Star className="w-3 h-3" /> Flagship</Badge>}
                  <Badge variant={b.published ? "default" : "secondary"}>{b.published ? "Published" : "Draft"}</Badge>
                  <Badge variant="secondary" className="capitalize">{b.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {realmName(b.realmId)} · {b.languages.join(", ")} ·{" "}
                  {b.pageCountMode === "number" ? `${b.pageCount} pages` : (
                    <span className="inline-flex items-center gap-1">
                      {b.pageCountMode === "infinite" && <InfinityIcon className="w-3 h-3" />}
                      {PAGE_MODE_LABELS[b.pageCountMode]}
                    </span>
                  )}
                </p>
                {b.synopsis && <p className="text-sm text-muted-foreground line-clamp-2">{b.synopsis}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(b)} title="Edit this book">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    removeBook({ id: b._id })
                      .then(() => toast.success("Book removed."))
                      .catch(() => toast.error("Failed."))
                  }
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

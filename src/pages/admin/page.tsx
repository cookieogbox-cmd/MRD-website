import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { PlusIcon, Pencil, Trash2, X, Check, ShieldOff, Eye, EyeOff, UploadIcon, Coins, Tag } from "lucide-react";
import { ConvexError } from "convex/values";
import { useAuth } from "@/hooks/use-auth.ts";
import BookStudioTab from "./_components/book-studio-tab.tsx";
import BookEpisodeBuilderTab from "./_components/book-episode-builder-tab.tsx";
import SiteTextTab from "./_components/site-text-tab.tsx";

const ADMIN_EMAILS = ["thenewblacklinedynasty@gmail.com", "cookieogbox@gmail.com"];

// ─── Episodes Tab ────────────────────────────────────────────────────────────

type EpStatus = "coming_soon" | "released";

type EpForm = {
  title: string;
  chapter: string;
  description: string;
  releaseDate: string;
  status: EpStatus;
  coverUrl: string;
  coverStorageId: Id<"_storage"> | null;
  coverPreview: string;
  order: string;
};

const EMPTY_EP: EpForm = {
  title: "", chapter: "", description: "", releaseDate: "",
  status: "coming_soon", coverUrl: "", coverStorageId: null, coverPreview: "", order: "1",
};

function EpisodesTab() {
  const episodes = useQuery(api.upcomingEpisodes.list, {});
  const chapters = useQuery(api.chapters.list, {});
  const createEpisode = useMutation(api.upcomingEpisodes.create);
  const updateEpisode = useMutation(api.upcomingEpisodes.update);
  const removeEpisode = useMutation(api.upcomingEpisodes.remove);
  const generateUploadUrl = useMutation(api.upcomingEpisodes.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"upcomingEpisodes"> | null>(null);
  const [form, setForm] = useState<EpForm>(EMPTY_EP);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleField = (field: keyof EpForm, value: string | Id<"_storage"> | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_EP, order: String((episodes?.length ?? 0) + 1) });
    setShowForm(true);
  };

  const openEdit = (ep: NonNullable<typeof episodes>[number]) => {
    setEditingId(ep._id);
    setForm({
      title: ep.title, chapter: ep.chapter, description: ep.description,
      releaseDate: ep.releaseDate ?? "", status: ep.status,
      coverUrl: ep.coverUrl ?? "",
      coverStorageId: ep.coverStorageId ?? null,
      coverPreview: ep.resolvedCoverUrl ?? "",
      order: String(ep.order),
    });
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json() as { storageId: Id<"_storage"> };
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

  const handleSave = async () => {
    if (!form.title.trim() || !form.chapter.trim() || !form.description.trim()) {
      toast.error("Title, chapter, and description are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), chapter: form.chapter.trim(),
        description: form.description.trim(),
        releaseDate: form.releaseDate.trim() || undefined,
        status: form.status,
        coverUrl: form.coverStorageId ? undefined : (form.coverUrl.trim() || undefined),
        coverStorageId: form.coverStorageId ?? undefined,
        order: Number(form.order) || 1,
      };
      if (editingId) {
        await updateEpisode({ id: editingId, ...payload });
        toast.success("Episode updated!");
      } else {
        await createEpisode(payload);
        toast.success("Episode posted!");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <PlusIcon className="w-4 h-4" /> Add Episode
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Episode" : "New Upcoming Episode"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Chapter Label *</label>
                <Select value={form.chapter} onValueChange={(v) => handleField("chapter", v)}>
                  <SelectTrigger><SelectValue placeholder="Select a book…" /></SelectTrigger>
                  <SelectContent>
                    {(chapters ?? []).map((c) => (
                      <SelectItem key={c.number} value={`${c.number} — ${c.seriesColor || c.title}`}>
                        {c.number} — {c.seriesColor || c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Episode Title *</label>
                <Input placeholder="e.g. The Whispering Tower" value={form.title} onChange={(e) => handleField("title", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description *</label>
              <Textarea placeholder="Brief description or teaser..." rows={3} value={form.description} onChange={(e) => handleField("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => handleField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Release Date (optional)</label>
                <Input placeholder="e.g. June 2026" value={form.releaseDate} onChange={(e) => handleField("releaseDate", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Display Order</label>
                <Input type="number" min="1" value={form.order} onChange={(e) => handleField("order", e.target.value)} />
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Image (optional)</label>
              {form.coverPreview && (
                <div className="relative inline-block">
                  <img src={form.coverPreview} alt="Preview" className="h-32 rounded-lg object-cover border" />
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
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Cover"}
                </Button>
                <span className="text-xs text-muted-foreground">or paste a URL below</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
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

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editingId ? "Save Changes" : "Post Episode"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {episodes === undefined ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No upcoming episodes yet</p>
          <p className="text-sm mt-1">Click "Add Episode" to post your first upcoming release.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <Card key={ep._id} className="flex flex-row items-start gap-4 p-4">
              {ep.resolvedCoverUrl && (
                <img src={ep.resolvedCoverUrl} alt={ep.title} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{ep.chapter}</span>
                  <Badge variant={ep.status === "released" ? "default" : "secondary"}>
                    {ep.status === "released" ? "Released" : "Coming Soon"}
                  </Badge>
                  {ep.releaseDate && <span className="text-xs text-muted-foreground">{ep.releaseDate}</span>}
                </div>
                <h3 className="font-semibold text-foreground truncate">{ep.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ep.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(ep)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeEpisode({ id: ep._id }).then(() => toast.success("Removed.")).catch(() => toast.error("Failed."))}>
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

// ─── Content Blocks Tab ──────────────────────────────────────────────────────

type BlockForm = {
  title: string;
  body: string;
  imageUrl: string;
  imageStorageId: Id<"_storage"> | null;
  imagePreview: string;
  visible: boolean;
  order: string;
};

const EMPTY_BLOCK: BlockForm = {
  title: "", body: "", imageUrl: "", imageStorageId: null, imagePreview: "", visible: true, order: "1",
};

function ContentBlocksTab() {
  const blocks = useQuery(api.contentBlocks.list, {});
  const createBlock = useMutation(api.contentBlocks.create);
  const updateBlock = useMutation(api.contentBlocks.update);
  const removeBlock = useMutation(api.contentBlocks.remove);
  const generateUploadUrl = useMutation(api.contentBlocks.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"contentBlocks"> | null>(null);
  const [form, setForm] = useState<BlockForm>(EMPTY_BLOCK);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleField = (field: keyof BlockForm, value: string | boolean | Id<"_storage"> | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_BLOCK, order: String((blocks?.length ?? 0) + 1) });
    setShowForm(true);
  };

  const openEdit = (b: NonNullable<typeof blocks>[number]) => {
    setEditingId(b._id);
    setForm({
      title: b.title, body: b.body ?? "", imageUrl: b.imageUrl ?? "",
      imageStorageId: b.imageStorageId ?? null,
      imagePreview: b.resolvedImageUrl ?? "",
      visible: b.visible, order: String(b.order),
    });
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json() as { storageId: Id<"_storage"> };
      setForm((prev) => ({
        ...prev,
        imageStorageId: storageId,
        imageUrl: "",
        imagePreview: URL.createObjectURL(file),
      }));
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        imageUrl: form.imageStorageId ? undefined : (form.imageUrl.trim() || undefined),
        imageStorageId: form.imageStorageId ?? undefined,
        visible: form.visible,
        order: Number(form.order) || 1,
      };
      if (editingId) {
        await updateBlock({ id: editingId, ...payload });
        toast.success("Block updated!");
      } else {
        await createBlock(payload);
        toast.success("Block created!");
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

  const toggleVisible = async (b: NonNullable<typeof blocks>[number]) => {
    try {
      await updateBlock({ id: b._id, visible: !b.visible });
      toast.success(b.visible ? "Block hidden." : "Block visible.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-lg">
          Content blocks appear on the public Upcoming page. Add sections like "Diaries Color Code", announcements, or images. Toggle visibility to show or hide them without deleting.
        </p>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <PlusIcon className="w-4 h-4" /> Add Block
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Block" : "New Content Block"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title *</label>
                <Input placeholder="e.g. Diaries Color Code" value={form.title} onChange={(e) => handleField("title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Display Order</label>
                <Input type="number" min="1" value={form.order} onChange={(e) => handleField("order", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Body Text (optional)</label>
              <Textarea placeholder="Description, announcement, or any text content..." rows={4} value={form.body} onChange={(e) => handleField("body", e.target.value)} />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image (optional)</label>
              {form.imagePreview && (
                <div className="relative inline-block">
                  <img src={form.imagePreview} alt="Preview" className="h-32 rounded-lg object-cover border" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageStorageId: null, imageUrl: "", imagePreview: "" }))}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                <span className="text-xs text-muted-foreground">or paste a URL below</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              {!form.imageStorageId && (
                <Input
                  placeholder="https://hercules-cdn.com/file_..."
                  value={form.imageUrl}
                  onChange={(e) => {
                    handleField("imageUrl", e.target.value);
                    handleField("imagePreview", e.target.value);
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Visible on public page</label>
              <button
                type="button"
                onClick={() => handleField("visible", !form.visible)}
                className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.visible ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.visible ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <span className="text-sm text-muted-foreground">{form.visible ? "Visible" : "Hidden"}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Block"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {blocks === undefined ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No content blocks yet</p>
          <p className="text-sm mt-1">Add blocks to display custom sections on the Upcoming page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b) => (
            <Card key={b._id} className={`p-4 ${!b.visible ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-4">
                {b.resolvedImageUrl && (
                  <img src={b.resolvedImageUrl} alt={b.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <Badge variant={b.visible ? "default" : "secondary"}>
                      {b.visible ? "Visible" : "Hidden"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Order: {b.order}</span>
                  </div>
                  {b.body && <p className="text-sm text-muted-foreground line-clamp-2">{b.body}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" title={b.visible ? "Hide" : "Show"} onClick={() => toggleVisible(b)}>
                    {b.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeBlock({ id: b._id }).then(() => toast.success("Deleted.")).catch(() => toast.error("Failed."))}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Token Packs Tab ─────────────────────────────────────────────────────────

type PackForm = {
  name: string;
  tokenAmount: string;
  price: string;
  active: boolean;
  order: string;
};

const EMPTY_PACK: PackForm = { name: "", tokenAmount: "", price: "", active: true, order: "1" };

function TokenPacksTab() {
  const packs = useQuery(api.tokens.listPacks, {});
  const createPack = useMutation(api.tokens.createPack);
  const updatePack = useMutation(api.tokens.updatePack);
  const removePack = useMutation(api.tokens.removePack);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tokenPacks"> | null>(null);
  const [form, setForm] = useState<PackForm>(EMPTY_PACK);
  const [saving, setSaving] = useState(false);

  const handleField = (field: keyof PackForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PACK, order: String((packs?.length ?? 0) + 1) });
    setShowForm(true);
  };

  const openEdit = (p: NonNullable<typeof packs>[number]) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      tokenAmount: String(p.tokenAmount),
      price: String(p.price / 100),
      active: p.active,
      order: String(p.order),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.tokenAmount || !form.price) {
      toast.error("Name, token amount, and price are required.");
      return;
    }
    const tokenAmount = Number(form.tokenAmount);
    const price = Math.round(Number(form.price) * 100);
    if (isNaN(tokenAmount) || tokenAmount <= 0) { toast.error("Token amount must be a positive number."); return; }
    if (isNaN(price) || price <= 0) { toast.error("Price must be a positive number."); return; }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), tokenAmount, price, active: form.active, order: Number(form.order) || 1 };
      if (editingId) {
        await updatePack({ id: editingId, ...payload });
        toast.success("Pack updated!");
      } else {
        await createPack(payload);
        toast.success("Pack created!");
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-lg">
          Define token packs that users can purchase. Set the pack name, how many tokens it grants, and the price in USD. Deactivate a pack to hide it from the store without deleting it.
        </p>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <PlusIcon className="w-4 h-4" /> Add Pack
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Token Pack" : "New Token Pack"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Pack Name *</label>
                <Input placeholder="e.g. Starter Pack" value={form.name} onChange={(e) => handleField("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tokens Granted *</label>
                <Input type="number" min="1" placeholder="e.g. 100" value={form.tokenAmount} onChange={(e) => handleField("tokenAmount", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Price (USD) *</label>
                <Input type="number" min="0.01" step="0.01" placeholder="e.g. 1.00" value={form.price} onChange={(e) => handleField("price", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Display Order</label>
                <Input type="number" min="1" value={form.order} onChange={(e) => handleField("order", e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="text-sm font-medium">Active (visible in store)</label>
                <button
                  type="button"
                  onClick={() => handleField("active", !form.active)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.active ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.active ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />{saving ? "Saving..." : editingId ? "Save Changes" : "Create Pack"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {packs === undefined ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : packs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Coins className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No token packs yet</p>
          <p className="text-sm mt-1">Create your first token pack to allow users to purchase tokens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((p) => (
            <Card key={p._id} className={`flex items-center gap-4 p-4 ${!p.active ? "opacity-60" : ""}`}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-foreground">{p.name}</span>
                  <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.tokenAmount} tokens · ${(p.price / 100).toFixed(2)} USD</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => removePack({ id: p._id }).then(() => toast.success("Pack removed.")).catch(() => toast.error("Failed."))}>
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

// ─── Promo Codes Tab ──────────────────────────────────────────────────────────

type PromoType = "free_tokens" | "discount";

type PromoForm = {
  code: string;
  type: PromoType;
  tokenAmount: string;
  discountPercent: string;
  maxUses: string;
  active: boolean;
};

const EMPTY_PROMO: PromoForm = { code: "", type: "free_tokens", tokenAmount: "", discountPercent: "", maxUses: "", active: true };

function PromoCodesTab() {
  const promos = useQuery(api.tokens.listPromoCodes, {});
  const createPromo = useMutation(api.tokens.createPromoCode);
  const updatePromo = useMutation(api.tokens.updatePromoCode);
  const removePromo = useMutation(api.tokens.removePromoCode);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"promoCodes"> | null>(null);
  const [form, setForm] = useState<PromoForm>(EMPTY_PROMO);
  const [saving, setSaving] = useState(false);

  const handleField = (field: keyof PromoForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PROMO);
    setShowForm(true);
  };

  const openEdit = (p: NonNullable<typeof promos>[number]) => {
    setEditingId(p._id);
    setForm({
      code: p.code,
      type: p.type,
      tokenAmount: String(p.tokenAmount ?? ""),
      discountPercent: String(p.discountPercent ?? ""),
      maxUses: String(p.maxUses ?? ""),
      active: p.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editingId && !form.code.trim()) { toast.error("Promo code is required."); return; }
    if (form.type === "free_tokens" && (!form.tokenAmount || Number(form.tokenAmount) <= 0)) {
      toast.error("Token amount is required for free-token codes."); return;
    }
    if (form.type === "discount" && (!form.discountPercent || Number(form.discountPercent) <= 0 || Number(form.discountPercent) > 100)) {
      toast.error("Discount must be between 1 and 100."); return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePromo({
          id: editingId,
          active: form.active,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          tokenAmount: form.tokenAmount ? Number(form.tokenAmount) : undefined,
          discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
        });
        toast.success("Promo code updated!");
      } else {
        await createPromo({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          tokenAmount: form.tokenAmount ? Number(form.tokenAmount) : undefined,
          discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          active: form.active,
        });
        toast.success("Promo code created!");
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-lg">
          Create promo codes. <strong>Free-token codes</strong> credit tokens directly to the user. <strong>Discount codes</strong> reduce the price when purchasing a token pack.
        </p>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <PlusIcon className="w-4 h-4" /> Add Code
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Promo Code" : "New Promo Code"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Code *</label>
                <Input
                  placeholder="e.g. WELCOME50"
                  value={form.code}
                  disabled={!!editingId}
                  onChange={(e) => handleField("code", e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type *</label>
                <Select value={form.type} onValueChange={(v) => handleField("type", v)} disabled={!!editingId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_tokens">Free Tokens</SelectItem>
                    <SelectItem value="discount">Purchase Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === "free_tokens" ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">Tokens to Grant *</label>
                <Input type="number" min="1" placeholder="e.g. 50" value={form.tokenAmount} onChange={(e) => handleField("tokenAmount", e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-medium">Discount Percentage *</label>
                <Input type="number" min="1" max="100" placeholder="e.g. 20 (for 20% off)" value={form.discountPercent} onChange={(e) => handleField("discountPercent", e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Max Uses (leave blank for unlimited)</label>
                <Input type="number" min="1" placeholder="Unlimited" value={form.maxUses} onChange={(e) => handleField("maxUses", e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="text-sm font-medium">Active</label>
                <button
                  type="button"
                  onClick={() => handleField("active", !form.active)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.active ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.active ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />{saving ? "Saving..." : editingId ? "Save Changes" : "Create Code"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {promos === undefined ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No promo codes yet</p>
          <p className="text-sm mt-1">Create codes to offer free tokens or purchase discounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => (
            <Card key={p._id} className={`flex items-center gap-4 p-4 ${!p.active ? "opacity-60" : ""}`}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono font-bold text-foreground">{p.code}</span>
                  <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                  <Badge variant="outline">{p.type === "free_tokens" ? "Free Tokens" : "Discount"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.type === "free_tokens"
                    ? `Grants ${p.tokenAmount} tokens`
                    : `${p.discountPercent}% off purchases`}
                  {" · "}
                  {p.usedCount} used{p.maxUses !== undefined ? ` / ${p.maxUses} max` : " / unlimited"}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => removePromo({ id: p._id }).then(() => toast.success("Removed.")).catch(() => toast.error("Failed."))}>
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

// ─── Portal CMS Admin Tab ────────────────────────────────────────────────────

function PortalCmsTab() {
  const pages = useQuery(api.portal.listAll, {});
  const createPage = useMutation(api.portal.create);
  const updatePage = useMutation(api.portal.update);
  const removePage = useMutation(api.portal.remove);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"portalPages"> | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setSlug("");
    setTitle("");
    setSubtitle("");
    setBody("");
    setCoverUrl("");
    setPublished(true);
    setShowForm(true);
  };

  const openEdit = (p: NonNullable<typeof pages>[number]) => {
    setEditingId(p._id);
    setSlug(p.slug);
    setTitle(p.title);
    setSubtitle(p.subtitle ?? "");
    setBody(p.body);
    setCoverUrl(p.coverUrl ?? "");
    setPublished(p.published);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!slug.trim() || !title.trim() || !body.trim()) {
      toast.error("Slug, title, and body are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePage({
          id: editingId,
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          body: body.trim(),
          coverUrl: coverUrl.trim() || undefined,
          published,
        });
        toast.success("Page updated!");
      } else {
        await createPage({
          slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          body: body.trim(),
          coverUrl: coverUrl.trim() || undefined,
          published,
          order: (pages?.length ?? 0) + 1,
        });
        toast.success("Page created!");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Portal CMS</h2>
          <p className="text-sm text-muted-foreground">Create and manage custom pages (articles, lore, news)</p>
        </div>
        <Button onClick={openCreate} className="gap-2" size="sm">
          <PlusIcon className="w-4 h-4" /> New Page
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Page" : "New Page"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Slug (URL) *</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-malka" disabled={!!editingId} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="About Malka" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subtitle (optional)</label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="The story behind the story" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Body *</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[200px]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your content here. Each new line becomes a paragraph."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cover Image URL (optional)</label>
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://hercules-cdn.com/file_..." />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Published</label>
              <button
                type="button"
                onClick={() => setPublished(!published)}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${published ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${published ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />{saving ? "Saving..." : editingId ? "Save Changes" : "Create Page"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pages === undefined ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No pages yet. Create your first portal page.</div>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <Card key={p._id} className={`flex items-center gap-4 p-4 ${!p.published ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{p.title}</span>
                  <Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Published" : "Draft"}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">/portal/{p.slug}</span>
                </div>
                {p.subtitle && <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /> Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => removePage({ id: p._id }).then(() => toast.success("Removed.")).catch(() => toast.error("Failed."))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vive Admin Tab ─────────────────────────────────────────────────────────

function ViveAdminTab() {
  const chambers = useQuery(api.chambers.list, {});
  const createChamber = useMutation(api.chambers.createChamber);
  const updateChamber = useMutation(api.chambers.updateChamber);
  const deleteChamber = useMutation(api.chambers.deleteChamber);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"chambers"> | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("💬");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("💬");
    setShowForm(true);
  };

  const openEdit = (c: NonNullable<typeof chambers>[number]) => {
    setEditingId(c._id);
    setName(c.name);
    setDescription(c.description);
    setIcon(c.icon);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error("Name and description required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateChamber({ id: editingId, name: name.trim(), description: description.trim(), icon: icon.trim() });
        toast.success("Chamber updated!");
      } else {
        await createChamber({ name: name.trim(), description: description.trim(), icon: icon.trim() || "💬" });
        toast.success("Chamber created!");
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

  const handleDelete = async (id: Id<"chambers">) => {
    try {
      await deleteChamber({ id });
      toast.success("Chamber deleted.");
    } catch {
      toast.error("Failed to delete chamber.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Vive Chambers</h2>
          <p className="text-sm text-muted-foreground">Create, edit, and delete chat chambers (like Discord channels)</p>
        </div>
        <Button onClick={openCreate} className="gap-2" size="sm">
          <PlusIcon className="w-4 h-4" /> Add Chamber
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{editingId ? "Edit Chamber" : "New Chamber"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Icon (emoji)</label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="💬" />
              </div>
              <div className="space-y-1 col-span-3">
                <label className="text-sm font-medium">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="General" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description *</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hang out and chat about anything" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />{saving ? "Saving..." : editingId ? "Save Changes" : "Create Chamber"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {chambers === undefined ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : chambers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No chambers yet.</div>
      ) : (
        <div className="space-y-3">
          {chambers.map((ch) => (
            <Card key={ch._id} className="flex items-center gap-4 p-4">
              <span className="text-2xl">{ch.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">{ch.name}</span>
                <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
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

// ─── Main Admin ──────────────────────────────────────────────────────────────

type Tab = "books" | "book_episodes" | "episodes" | "blocks" | "token_packs" | "promo_codes" | "vive" | "portal" | "site_text";

const TAB_LABELS: Record<Tab, string> = {
  books: "Book Studio",
  book_episodes: "Episode Builder",
  episodes: "Upcoming Episodes",
  blocks: "Content Blocks",
  token_packs: "Token Packs",
  promo_codes: "Promo Codes",
  vive: "Vive Chambers",
  portal: "Portal CMS",
  site_text: "Site Text",
};

function AdminInner() {
  const [tab, setTab] = useState<Tab>("books");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage upcoming episodes, content blocks, token packs, and promo codes</p>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card px-6 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {(["books", "book_episodes", "episodes", "blocks", "token_packs", "promo_codes", "vive", "portal", "site_text"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === "books" && <BookStudioTab />}
        {tab === "book_episodes" && <BookEpisodeBuilderTab />}
        {tab === "episodes" && <EpisodesTab />}
        {tab === "blocks" && <ContentBlocksTab />}
        {tab === "token_packs" && <TokenPacksTab />}
        {tab === "promo_codes" && <PromoCodesTab />}
        {tab === "vive" && <ViveAdminTab />}
        {tab === "portal" && <PortalCmsTab />}
        {tab === "site_text" && <SiteTextTab />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-medium text-foreground">Sign in to access the admin panel</p>
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
  return <AdminInner />;
}

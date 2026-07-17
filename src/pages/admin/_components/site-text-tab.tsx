import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { ConvexError } from "convex/values";

// Admin tab to edit homepage copy blocks like the "Magical Must Note".
export default function SiteTextTab() {
  const blocks = useQuery(api.siteText.list, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Site Text</h2>
        <p className="text-sm text-muted-foreground max-w-lg">
          Edit special copy that appears on the homepage. The "Magical Must Note" is the
          bold, tappable note that unfurls its story when readers click it.
        </p>
      </div>

      {blocks === undefined ? (
        <div className="space-y-3">{[1].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
      ) : blocks.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Sparkles /></EmptyMedia>
            <EmptyTitle>No text blocks yet</EmptyTitle>
            <EmptyDescription>Visit the homepage once to seed the default note, then edit it here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {blocks.map((b) => (
            <TextBlockEditor key={b._id} block={b} />
          ))}
        </div>
      )}
    </div>
  );
}

type Block = {
  _id: Id<"siteText">;
  label: string;
  title: string;
  body: string;
  cta: string;
};

function TextBlockEditor({ block }: { block: Block }) {
  const update = useMutation(api.siteText.update);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [cta, setCta] = useState(block.cta);
  const [body, setBody] = useState(block.body);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setTitle(block.title);
    setCta(block.cta);
    setBody(block.body);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and note text are required.");
      return;
    }
    setSaving(true);
    try {
      await update({ id: block._id, title: title.trim(), cta: cta.trim(), body: body.trim() });
      toast.success("Saved!");
      setEditing(false);
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
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> {block.label}
        </CardTitle>
        {!editing ? (
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={startEdit}>
            <Pencil className="w-3 h-3" /> Edit
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium">Bold headline (always visible)</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Magical Must Note" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tap prompt</label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Click me: About Story" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Note text (unfurls on tap)</label>
              <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="The full story note…" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Check className="w-4 h-4" />{saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{block.title}</p>
            <p className="text-xs text-primary">{block.cta}</p>
            <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{block.body}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

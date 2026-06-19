"use client";

import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usePage } from "@/hooks/usePage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { EDITABLE_PAGES } from "@/types";
import { FileText, ExternalLink } from "lucide-react";

export default function AdminPagesPage() {
  const { user } = useAuth();
  const [slug, setSlug] = useState<string>(EDITABLE_PAGES[0].slug);
  const meta = EDITABLE_PAGES.find((p) => p.slug === slug) ?? EDITABLE_PAGES[0];

  const { data: page, loading } = usePage(slug);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the selected page into the form.
  useEffect(() => {
    setTitle(page?.title ?? meta.title);
    setBody(page?.body ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, slug]);

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.pages, slug),
        {
          slug,
          title: title.trim() || meta.title,
          body,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
        },
        { merge: true },
      );
      toast({ type: "success", message: `${meta.title} page saved.` });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Pages"
        subtitle="Edit Rules, About and legal content shown on the public site"
        action={
          <a
            href={meta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold uppercase text-vblue hover:underline"
          >
            View <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      {/* Page picker */}
      <div className="mb-6 flex flex-wrap gap-2">
        {EDITABLE_PAGES.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSlug(p.slug)}
            className={`inline-flex items-center gap-2 rounded-2xl border-4 border-ink px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-brutal-xs transition-transform hover:-translate-y-0.5 ${
              slug === p.slug ? "bg-ink text-cream" : "bg-cream text-ink"
            }`}
          >
            <FileText className="h-4 w-4" />
            {p.title}
          </button>
        ))}
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Edit {meta.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <div>
                <Label>Page Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={meta.title} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Write the ${meta.title.toLowerCase()} content here.\n\nBlank lines start new paragraphs. Plain text — no HTML needed.`}
                  className="min-h-[420px] font-medium leading-relaxed"
                />
                <p className="mt-1 text-xs font-medium text-ink/50">
                  Line breaks and blank lines are preserved on the public page.
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="yellow" size="lg" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Page"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

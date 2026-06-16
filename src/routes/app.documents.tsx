import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/documents")({
  component: DocumentsPage,
});

type Doc = {
  id: string;
  name: string;
  category: string;
  storage_path: string;
  size_bytes: number | null;
  content_type: string | null;
  created_at: string;
};

const CATEGORIES = [
  { value: "passport", label: "Passport / ID" },
  { value: "visa", label: "Visa / Residency" },
  { value: "bank", label: "Bank Statement" },
  { value: "business_plan", label: "Business Plan" },
  { value: "incorporation", label: "Incorporation Docs" },
  { value: "tax", label: "Tax / Financial" },
  { value: "other", label: "Other" },
];

const BUCKET = "user-documents";

function formatSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("passport");
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs((data as Doc[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}_${safeName}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (up.error) {
      toast.error(up.error.message);
      setUploading(false);
      return;
    }
    const ins = await supabase.from("user_documents").insert({
      user_id: user.id,
      name: file.name,
      category,
      storage_path: path,
      size_bytes: file.size,
      content_type: file.type || null,
    });
    if (ins.error) {
      toast.error(ins.error.message);
      await supabase.storage.from(BUCKET).remove([path]);
    } else {
      toast.success("Uploaded");
      await load();
    }
    if (fileInput.current) fileInput.current.value = "";
    setUploading(false);
  }

  async function download(doc: Doc) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Could not generate link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(doc: Doc) {
    if (!confirm(`Delete ${doc.name}?`)) return;
    const { error: sErr } = await supabase.storage
      .from(BUCKET)
      .remove([doc.storage_path]);
    if (sErr) {
      toast.error(sErr.message);
      return;
    }
    const { error } = await supabase
      .from("user_documents")
      .delete()
      .eq("id", doc.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setDocs((d) => d.filter((x) => x.id !== doc.id));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl">Document Vault</h1>
        <p className="text-sm text-muted-foreground">
          Store passports, visas, business plans and more. Private to you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload a document</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File (max 20MB)</Label>
            <div className="flex gap-2">
              <Input ref={fileInput} type="file" onChange={handleUpload} disabled={uploading} />
              {uploading && <Loader2 className="h-5 w-5 animate-spin self-center" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet. Upload your first file above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((d) => {
                const cat = CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category;
                return (
                  <li key={d.id} className="flex items-center gap-4 py-3">
                    <FileText className="h-5 w-5 text-neon shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cat} · {formatSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => download(d)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(d)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

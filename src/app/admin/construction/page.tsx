"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

const stages = [
  { value: "FOUNDATION", label: "Foundation" },
  { value: "STRUCTURE", label: "Structure" },
  { value: "BRICKWORK", label: "Brickwork" },
  { value: "PLASTERING", label: "Plastering" },
  { value: "FINISHING", label: "Finishing" },
  { value: "EXTERNAL_DEVELOPMENT", label: "External Development" },
  { value: "HANDOVER_READY", label: "Handover Ready" },
];

export default function AdminConstructionPage() {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    stage: "FOUNDATION",
    projectId: "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("stage", form.stage);
    if (form.projectId) formData.append("projectId", form.projectId);

    try {
      const res = await fetch("/api/admin/construction/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (res.ok) {
        toast.success("Construction update uploaded!");
        setForm({ title: "", description: "", stage: "FOUNDATION", projectId: "" });
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Construction Updates</h1>
        <p className="text-gray-500 mt-1">
          Upload photos and videos of construction progress
        </p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Construction Update</CardTitle>
          <CardDescription>
            Upload photos or videos with construction stage information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Foundation Complete - Block A"
              />
            </div>
            <div>
              <Label>Construction Stage</Label>
              <select
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {stages.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Additional details about this update..."
              rows={3}
            />
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Camera className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <Label
              htmlFor="construction-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                <>
                  <Upload className="h-4 w-4 inline mr-2" />
                  Upload Photos or Videos
                </>
              )}
            </Label>
            <Input
              id="construction-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              disabled={uploading || !form.title}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-2">
              {form.title
                ? "Select files to upload"
                : "Enter a title first, then upload files"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CCTV Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>CCTV Camera Configuration</CardTitle>
          <CardDescription>
            Configure CCTV cameras for automatic construction snapshots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>CCTV integration will be configured here.</p>
            <p className="text-sm mt-1">
              Add camera RTSP URLs to enable automatic periodic snapshots.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

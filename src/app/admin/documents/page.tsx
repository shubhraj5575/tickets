"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const documentTypes = [
  { value: "BOOKING_FORM", label: "Booking Form" },
  { value: "ALLOTMENT_LETTER", label: "Allotment Letter" },
  { value: "AGREEMENT_TO_SELL", label: "Agreement to Sell" },
  { value: "DEMAND_LETTER", label: "Demand Letter" },
  { value: "POSSESSION_LETTER", label: "Possession Letter" },
  { value: "OTHER", label: "Other" },
];

export default function AdminDocumentsPage() {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    bookingId: "",
    type: "BOOKING_FORM",
    title: "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", form.type);
    formData.append("title", form.title || file.name);
    if (form.customerId) formData.append("customerId", form.customerId);
    if (form.bookingId) formData.append("bookingId", form.bookingId);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (res.ok) {
        toast.success("Document uploaded successfully");
        setForm({ customerId: "", bookingId: "", type: "BOOKING_FORM", title: "" });
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
        <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-500 mt-1">Upload and manage customer documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload a document for a customer. They will be notified when the
            document is available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Document Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Allotment Letter - B-61/04"
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Customer ID</Label>
              <Input
                value={form.customerId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerId: e.target.value }))
                }
                placeholder="Customer ID"
              />
            </div>
            <div>
              <Label>Booking ID (optional)</Label>
              <Input
                value={form.bookingId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bookingId: e.target.value }))
                }
                placeholder="Booking ID"
              />
            </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <Label
              htmlFor="doc-upload"
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
                  Select File
                </>
              )}
            </Label>
            <Input
              id="doc-upload"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

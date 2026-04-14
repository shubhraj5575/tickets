"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

interface ImportBatch {
  id: string;
  fileName: string;
  status: string;
  extractedData: Record<string, string> | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PROCESSING: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  PENDING_REVIEW: { label: "Pending Review", color: "bg-blue-100 text-blue-800" },
  VERIFIED: { label: "Verified", color: "bg-green-100 text-green-800" },
  IMPORTED: { label: "Imported", color: "bg-green-100 text-green-800" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800" },
};

export default function BookingImportPage() {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [reviewBatch, setReviewBatch] = useState<ImportBatch | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, string>>({});

  const fetchBatches = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/import/batches", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBatches(json.batches);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/bookings/import", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });

        if (res.ok) {
          toast.success("PDF uploaded. Processing...");
          await fetchBatches();
        } else {
          const err = await res.json();
          toast.error(err.error || "Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [accessToken]
  );

  const openReview = (batch: ImportBatch & { verifiedData?: Record<string, string> | null }) => {
    setReviewBatch(batch);
    setReviewData(batch.verifiedData || batch.extractedData || {});
  };

  const handleVerify = async () => {
    if (!reviewBatch) return;

    try {
      const res = await fetch("/api/admin/import/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          batchId: reviewBatch.id,
          verifiedData: reviewData,
        }),
      });

      if (res.ok) {
        toast.success("Booking imported successfully!");
        setReviewBatch(null);
        await fetchBatches();
      } else {
        const err = await res.json();
        toast.error(err.error || "Verification failed");
      }
    } catch {
      toast.error("Verification failed");
    }
  };

  // Key fields to show in the review form
  const fieldGroups = [
    {
      label: "Customer Details",
      fields: [
        "applicant_name",
        "applicant_phone",
        "applicant_email",
        "applicant_address",
        "pan_number",
        "aadhaar_number",
      ],
    },
    {
      label: "Unit Details",
      fields: [
        "project_name",
        "unit_number",
        "unit_type",
        "area_sqft",
        "floor_number",
      ],
    },
    {
      label: "Payment Details",
      fields: [
        "total_price",
        "base_price_psf",
        "payment_plan_type",
        "booking_amount",
        "booking_date",
      ],
    },
    {
      label: "Co-Applicant",
      fields: [
        "co_applicant_name",
        "co_applicant_phone",
        "co_applicant_relationship",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Bookings</h1>
          <p className="text-gray-500 mt-1">
            Upload booking PDFs to extract and import customer data
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Booking PDF</CardTitle>
          <CardDescription>
            Upload a booking application PDF. The system will extract customer
            and unit details for your review before importing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <Label
              htmlFor="pdf-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing PDF...
                </span>
              ) : (
                <>
                  <Upload className="h-4 w-4 inline mr-2" />
                  Click to upload booking PDF
                </>
              )}
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-2">PDF files only, max 10MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {reviewBatch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review Extracted Data</CardTitle>
                <CardDescription>
                  Verify and correct the extracted information before importing.
                  Fields marked [VERIFY] need attention.
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setReviewBatch(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {fieldGroups.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {group.label}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.fields.map((field) => (
                    <div key={field}>
                      <Label htmlFor={field} className="text-xs text-gray-500">
                        {field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Label>
                      <Input
                        id={field}
                        value={reviewData[field] || ""}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                        className={
                          reviewData[field]?.includes("[VERIFY]")
                            ? "border-orange-400 bg-orange-50"
                            : ""
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setReviewBatch(null)}>
                Cancel
              </Button>
              <Button onClick={handleVerify}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve & Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No imports yet. Upload a booking PDF to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const config = statusConfig[batch.status];
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        {batch.fileName}
                      </TableCell>
                      <TableCell>
                        <Badge className={config?.color || ""}>
                          {config?.label || batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(batch.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        {(batch.status === "PENDING_REVIEW" ||
                          batch.status === "VERIFIED") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReview(batch)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

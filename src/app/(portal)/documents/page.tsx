"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  FileText,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface DocumentItem {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  BOOKING_FORM: "Booking Form",
  ALLOTMENT_LETTER: "Allotment Letter",
  PAYMENT_RECEIPT: "Payment Receipt",
  AGREEMENT_TO_SELL: "Agreement to Sell",
  DEMAND_LETTER: "Demand Letter",
  POSSESSION_LETTER: "Possession Letter",
  LOAN_SANCTION: "Loan Sanction",
  ID_PROOF: "ID Proof",
  OTHER: "Other",
};

const typeColors: Record<string, string> = {
  BOOKING_FORM: "bg-blue-50 text-blue-700",
  ALLOTMENT_LETTER: "bg-emerald-50 text-emerald-700",
  PAYMENT_RECEIPT: "bg-green-50 text-green-700",
  AGREEMENT_TO_SELL: "bg-purple-50 text-purple-700",
  DEMAND_LETTER: "bg-rose-50 text-rose-700",
  POSSESSION_LETTER: "bg-amber-50 text-amber-700",
  LOAN_SANCTION: "bg-cyan-50 text-cyan-700",
  ID_PROOF: "bg-orange-50 text-orange-700",
  OTHER: "bg-gray-50 text-gray-700",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return FileSpreadsheet;
  return FileText;
}

export default function DocumentsPage() {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (file: File) => {
    if (!accessToken) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "OTHER");
      formData.append("title", file.name);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (res.ok) {
        // Refresh documents list
        const docsRes = await fetch("/api/documents", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents || []);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    async function fetchDocuments() {
      try {
        const res = await fetch("/api/documents", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, [accessToken]);

  // Get unique document types for filter tabs
  const docTypes = Array.from(new Set(documents.map((d) => d.type)));

  // Filter documents
  const filtered = documents.filter((doc) => {
    const matchesFilter =
      activeFilter === "ALL" || doc.type === activeFilter;
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeLabels[doc.type] || doc.type)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            Document Vault
          </h1>
          <p className="text-gray-500 mt-1 ml-11">
            All your property documents in one place
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 shadow-sm gap-2"
          disabled={uploading}
          onClick={() => document.getElementById("doc-drop-input")?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          {
            label: "Total Documents",
            count: documents.length,
            icon: FileText,
            gradient: "from-primary to-primary/90",
          },
          {
            label: "Company Documents",
            count: documents.filter(
              (d) => d.uploadedBy === "ADMIN" || d.uploadedBy === "SYSTEM"
            ).length,
            icon: FolderOpen,
            gradient: "from-accent to-accent/90",
          },
          {
            label: "Your Uploads",
            count: documents.filter((d) => d.uploadedBy === "CUSTOMER")
              .length,
            icon: Upload,
            gradient: "from-primary/80 to-primary",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.count}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-2.5">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
          </Card>
        ))}
      </div>

      {/* Hidden file input for upload button */}
      <input
        type="file"
        id="doc-drop-input"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />

      {/* Search + Filter Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>{filtered.length} documents</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("ALL")}
            className={
              activeFilter === "ALL"
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "hover:bg-gray-100"
            }
          >
            All
          </Button>
          {docTypes.map((type) => (
            <Button
              key={type}
              variant={activeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(type)}
              className={
                activeFilter === type
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "hover:bg-gray-100"
              }
            >
              {typeLabels[type] || type}
            </Button>
          ))}
        </div>
      </div>

      {/* Document Cards Grid */}
      {filtered.length === 0 ? (
        <Card className="border border-gray-100">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No documents found
            </h3>
            <p className="text-gray-500 mt-1">
              {searchQuery
                ? "Try adjusting your search"
                : "No documents available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const FileIcon = getFileIcon(doc.mimeType);
            const colorClass = typeColors[doc.type] || typeColors.OTHER;

            return (
              <Card
                key={doc.id}
                className="group border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* File type icon */}
                    <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <FileIcon className="h-6 w-6 text-gray-500 group-hover:text-primary transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {doc.title}
                      </h3>

                      <Badge
                        className={`${colorClass} border-0 text-xs mt-1.5`}
                      >
                        {typeLabels[doc.type] || doc.type}
                      </Badge>

                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span>{formatRelativeDate(doc.createdAt)}</span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <Badge
                          variant={
                            doc.uploadedBy === "CUSTOMER"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {doc.uploadedBy === "CUSTOMER" ? "You" : "Company"}
                        </Badge>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/10"
                            onClick={() =>
                              window.open(doc.fileUrl, "_blank")
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = doc.fileUrl;
                              a.download = doc.title;
                              a.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

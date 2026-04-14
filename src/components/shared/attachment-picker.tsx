"use client";

import { useRef } from "react";
import { Paperclip, Camera, X, FileText, ImageIcon } from "lucide-react";

export interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
  compact?: boolean;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPicker({
  files,
  onChange,
  max = 10,
  compact = false,
  disabled = false,
}: AttachmentPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const add = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= max) break;
      next.push(f);
    }
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = files.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const atMax = files.length >= max;

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => {
            const isImage = f.type.startsWith("image/");
            return (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm bg-white"
              >
                {isImage ? (
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500" />
                )}
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-gray-500">{formatSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-gray-500 hover:text-red-600"
                  aria-label="Remove attachment"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || atMax}
          className={`inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:text-gray-900 ${
            compact ? "" : ""
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {compact ? "Files" : "Attach files"}
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={disabled || atMax}
          className="inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="h-3.5 w-3.5" />
          {compact ? "Camera" : "Take photo"}
        </button>
        {!compact && (
          <span className="text-xs text-gray-500 self-center">
            PDF or image — up to {max} files, 25 MB each
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function appendAttachmentsToFormData(fd: FormData, files: File[]) {
  for (const f of files) fd.append("files", f);
}

import { uploadFile } from "@/lib/s3";

export const ALLOWED_ATTACHMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

export type AttachmentData = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export type AttachmentValidationError = {
  error: string;
};

export function collectAttachmentFiles(form: FormData): File[] {
  const all = form.getAll("files");
  const single = form.get("file");
  const out: File[] = [];
  for (const f of all) if (f && typeof f !== "string") out.push(f as File);
  if (single && typeof single !== "string") out.push(single as File);
  return out;
}

export async function uploadAttachments(
  files: File[],
  keyPrefix: string
): Promise<AttachmentData[] | AttachmentValidationError> {
  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return {
      error: `Too many attachments (max ${MAX_ATTACHMENTS_PER_MESSAGE} per message)`,
    };
  }
  for (const f of files) {
    if (!ALLOWED_ATTACHMENT_MIME.includes(f.type)) {
      return {
        error: `${f.name}: only PDF and image files (jpg, png, webp) are allowed`,
      };
    }
    if (f.size > MAX_ATTACHMENT_BYTES) {
      return { error: `${f.name}: file too large (max 25MB)` };
    }
  }
  const results: AttachmentData[] = [];
  let i = 0;
  for (const f of files) {
    const buffer = Buffer.from(await f.arrayBuffer());
    const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${keyPrefix}/${Date.now()}-${i}-${safeName}`;
    const url = await uploadFile(key, buffer, f.type);
    results.push({ url, name: f.name, type: f.type, size: f.size });
    i += 1;
  }
  return results;
}

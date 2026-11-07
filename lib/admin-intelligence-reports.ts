import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPORTS_BUCKET } from "@/lib/market-intelligence";

export type AdminReport = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  file_name: string;
  file_size: number | null;
  published: boolean;
  published_at: string;
};

const PATH_PATTERN = /^reports\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/;
const MAX_BYTES = 50 * 1024 * 1024;

export async function listAdminReports(): Promise<AdminReport[]> {
  const { data, error } = await createAdminClient()
    .from("market_intelligence_reports")
    .select("id, title, summary, category, file_name, file_size, published, published_at")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminReport[];
}

/** A one-time upload link so the PDF goes straight to storage (large files would exceed the API body limit). */
export async function createReportUploadUrl(fileName: string, fileSize: number) {
  if (!/\.pdf$/i.test(fileName)) throw new Error("Upload a PDF file.");
  if (!(fileSize > 0) || fileSize > MAX_BYTES) throw new Error("The PDF must be smaller than 50 MB.");
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "report.pdf";
  const path = `reports/${randomUUID()}/${safeName}`;
  const { data, error } = await createAdminClient().storage.from(REPORTS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Could not prepare the upload.");
  return { path: data.path, token: data.token };
}

export async function createReport(input: { title: unknown; summary: unknown; category: unknown; path: unknown; fileName: unknown; fileSize: unknown }) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length < 3 || title.length > 200) throw new Error("Give the report a title (3–200 characters).");
  const path = typeof input.path === "string" ? input.path : "";
  if (!PATH_PATTERN.test(path)) throw new Error("The uploaded file could not be found. Upload it again.");
  const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

  const admin = createAdminClient();
  const folder = path.slice(0, path.lastIndexOf("/"));
  const { data: files } = await admin.storage.from(REPORTS_BUCKET).list(folder);
  if (!files?.some((file) => `${folder}/${file.name}` === path)) throw new Error("The uploaded file could not be found. Upload it again.");

  const { data, error } = await admin
    .from("market_intelligence_reports")
    .insert({
      title,
      summary: text(input.summary, 2000),
      category: text(input.category, 80),
      file_path: path,
      file_name: text(input.fileName, 200) ?? path.split("/").pop(),
      file_size: typeof input.fileSize === "number" && input.fileSize > 0 ? Math.round(input.fileSize) : null,
    })
    .select("id, title, summary, category, file_name, file_size, published, published_at")
    .single();
  if (error) throw new Error(error.message);
  return data as AdminReport;
}

export async function setReportPublished(id: string, published: boolean) {
  const { error } = await createAdminClient().from("market_intelligence_reports").update({ published }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string) {
  const admin = createAdminClient();
  const { data: report, error } = await admin.from("market_intelligence_reports").select("file_path").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!report) return;
  await admin.storage.from(REPORTS_BUCKET).remove([report.file_path]);
  const { error: deleteError } = await admin.from("market_intelligence_reports").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
}

/** Admin link to preview any report, published or not. */
export async function adminReportUrl(id: string) {
  const admin = createAdminClient();
  const { data: report } = await admin.from("market_intelligence_reports").select("file_path").eq("id", id).maybeSingle();
  if (!report) throw new Error("Report not found.");
  const { data, error } = await admin.storage.from(REPORTS_BUCKET).createSignedUrl(report.file_path, 300);
  if (error || !data) throw new Error(error?.message ?? "Could not open the report.");
  return data.signedUrl;
}

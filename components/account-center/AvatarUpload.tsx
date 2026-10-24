"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Profile photo picker: uploads the image to the public `avatars` bucket under the
 * user's folder and hands back its public URL (saved to profiles.avatar_url by the form).
 */
export default function AvatarUpload({ userId, value, onChange }: { userId: string; value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`The photo must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Photo uploaded. Save changes to keep it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-aviation-border bg-aviation-light text-aviation-primary">
        {value ? <img src={value} alt="Profile photo" className="h-full w-full object-cover" /> : <UserCircle size={30} />}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-aviation-border bg-white px-4 py-2 text-sm font-semibold text-aviation-dark hover:border-aviation-primary hover:text-aviation-primary disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-aviation-error hover:bg-aviation-error-soft"
          >
            <Trash2 size={16} />
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }}
        />
      </div>
    </div>
  );
}

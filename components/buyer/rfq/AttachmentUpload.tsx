"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload, FileText, Image as ImageIcon, X } from "lucide-react";

import { uploadRFQAttachment } from "@/lib/rfqs";

interface Props {
  attachments: string[];
  onChange: (attachments: string[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function AttachmentUpload({
  attachments,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  async function handleFiles(
    files: FileList | null
  ) {
    if (!files?.length) return;

    setUploading(true);

    try {
      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds the 10MB limit.`);
          continue;
        }

        const result =
          await uploadRFQAttachment(file);

        if (!result.success || !result.url) {
          toast.error(`Unable to upload ${file.name}.`);
          continue;
        }

        uploaded.push(result.url);
      }

      onChange([...attachments, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(url: string) {
    onChange(
      attachments.filter(
        (attachment) => attachment !== url
      )
    );
  }

  return (
    <div className="space-y-6">

      <button
        type="button"
        onClick={() =>
          inputRef.current?.click()
        }
        aria-describedby="rfq-attachment-help"
        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-aviation-border bg-aviation-light p-10 transition hover:border-aviation-border hover:bg-aviation-light"
      >
        <Upload className="mb-4 h-10 w-10 text-aviation-primary" />

        <p className="font-semibold">
          Click to upload files
        </p>

        <p className="mt-2 text-sm text-aviation-muted">
          PDF, Images, Word, Excel
        </p>

        <p className="text-xs text-aviation-muted">
          Maximum size: 10MB per file
        </p>
      </button>

      <p id="rfq-attachment-help" className="sr-only">PDF, image, Word or Excel files up to 10 MB each.</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) =>
          handleFiles(e.target.files)
        }
      />

      {uploading && (
        <div className="rounded-xl bg-aviation-success-soft p-4 text-aviation-success">
          Uploading files...
        </div>
      )}

      {attachments.length > 0 && (

        <div className="space-y-3">

          {attachments.map((url) => {

            const filename =
              url.split("/").pop() || "";

            const isImage =
              /\.(jpg|jpeg|png|gif|webp)$/i.test(
                filename
              );

            return (

              <div
                key={url}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >

                <div className="flex items-center gap-4">

                  {isImage ? (
                    <ImageIcon className="h-6 w-6 text-aviation-success" />
                  ) : (
                    <FileText className="h-6 w-6 text-aviation-error" />
                  )}

                  <span className="text-sm font-medium">
                    {filename}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeAttachment(url)
                  }
                  className="rounded-lg p-2 transition hover:bg-aviation-error-soft"
                >
                  <X className="h-5 w-5 text-aviation-error" />
                </button>

              </div>

            );
          })}

        </div>

      )}

    </div>
  );
}
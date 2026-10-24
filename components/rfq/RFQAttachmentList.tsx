"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { getRFQAttachmentUrl, rfqAttachmentName } from "@/lib/rfqs";

/** Photos and documents attached to an RFQ. Files are private; each link is signed on click. */
export default function RFQAttachmentList({ paths, emptyText = "No attachments." }: { paths?: string[] | null; emptyText?: string }) {
  const [opening, setOpening] = useState<string | null>(null);

  if (!paths?.length) return <p className="text-sm text-aviation-muted">{emptyText}</p>;

  async function open(path: string) {
    // Open the tab synchronously so pop-up blockers allow it, then point it at the signed URL.
    const tab = window.open("", "_blank");
    setOpening(path);
    const url = await getRFQAttachmentUrl(path);
    setOpening(null);
    if (url && tab) tab.location.href = url;
    else {
      tab?.close();
      alert("This attachment could not be opened. Please try again.");
    }
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {paths.map((path) => (
        <li key={path}>
          <button
            type="button"
            onClick={() => open(path)}
            className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-aviation-border bg-white px-4 py-3 text-left text-sm font-medium text-aviation-dark hover:border-aviation-primary hover:text-aviation-primary"
          >
            {opening === path ? <Loader2 size={18} className="shrink-0 animate-spin" /> : <FileText size={18} className="shrink-0" />}
            <span className="truncate">{rfqAttachmentName(path)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

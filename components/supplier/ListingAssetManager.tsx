"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, GripVertical, ImagePlus, Loader2, Star, Trash2, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import type { PartFormData, ListingDocumentAsset, ListingDocumentDraft, ListingImageAsset, ListingImageDraft } from "./types";
import { supabase } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  partId?: string;
  formData: PartFormData;
  setFormData: (updater: (previous: PartFormData) => PartFormData) => void;
  existingImages: ListingImageAsset[];
  setExistingImages: React.Dispatch<React.SetStateAction<ListingImageAsset[]>>;
  existingDocuments: ListingDocumentAsset[];
  setExistingDocuments: React.Dispatch<React.SetStateAction<ListingDocumentAsset[]>>;
  uploadProgress: { completed: number; total: number } | null;
}

export default function ListingAssetManager({ partId, formData, setFormData, existingImages, setExistingImages, existingDocuments, setExistingDocuments, uploadProgress }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const drafts = formData.imageDrafts ?? [];
  const draftsRef = useRef<ListingImageDraft[]>(drafts);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    return () => {
      draftsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const validateAndAdd = useCallback((files: File[]) => {
    const accepted: ListingImageDraft[] = [];
    for (const file of files) {
      if (!ACCEPTED_IMAGES.includes(file.type)) {
        toast.error(`${file.name}: use JPG, PNG or WebP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name}: maximum image size is 8 MB.`);
        continue;
      }
      const id = crypto.randomUUID();
      accepted.push({ id, file, previewUrl: URL.createObjectURL(file), filename: file.name, altText: `${formData.manufacturer || "Aircraft part"} ${formData.partNumber || ""}`.trim(), uploadStatus: "Ready", progress: 0, isPrimary: false });
    }
    if (accepted.length) setFormData((prev) => ({ ...prev, images: [...prev.images, ...accepted.map((item) => item.file)], imageDrafts: [...(prev.imageDrafts ?? []), ...accepted] }));
  }, [formData.manufacturer, formData.partNumber, setFormData]);

  const removeDraft = (id: string) => {
    setFormData((prev) => {
      const target = (prev.imageDrafts ?? []).find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const nextDrafts = (prev.imageDrafts ?? []).filter((item) => item.id !== id);
      return { ...prev, images: nextDrafts.map((item) => item.file), imageDrafts: nextDrafts };
    });
  };

  const moveDraft = (id: string, direction: -1 | 1) => {
    setFormData((prev) => {
      const list = [...(prev.imageDrafts ?? [])];
      const index = list.findIndex((item) => item.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= list.length) return prev;
      [list[index], list[next]] = [list[next], list[index]];
      return { ...prev, images: list.map((item) => item.file), imageDrafts: list };
    });
  };

  const updateAlt = (id: string, altText: string) => setFormData((prev) => ({ ...prev, imageDrafts: (prev.imageDrafts ?? []).map((item) => item.id === id ? { ...item, altText } : item) }));

  const setDraftPrimary = (id: string) => setFormData((prev) => ({ ...prev, imageDrafts: (prev.imageDrafts ?? []).map((item) => ({ ...item, isPrimary: item.id === id })) }));
  const setExistingPrimary = (id: string) => {
    setFormData((prev) => ({ ...prev, imageDrafts: (prev.imageDrafts ?? []).map((item) => ({ ...item, isPrimary: false })) }));
    setExistingImages((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return items;
    const next = [...items];
    const [selected] = next.splice(index, 1);
    next.unshift({ ...selected, isPrimary: true });
    return next.map((item, order) => ({ ...item, sortOrder: order, isPrimary: order === 0 }));
    });
  };
  const removeExisting = (asset: ListingImageAsset) => {
    setExistingImages((items) => items.filter((item) => item.id !== asset.id).map((item, order) => ({ ...item, sortOrder: order, isPrimary: order === 0 })));
    toast.success("Image marked for removal. Save the listing to apply the change.");
  };

  const documentDrafts = formData.documentDrafts ?? [];
  const addDocuments = (files: File[]) => {
    const accepted: ListingDocumentDraft[] = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name}: maximum document size is 10 MB.`); continue; }
      accepted.push({ id: crypto.randomUUID(), documentType: "Supporting document", file, uploadStatus: "Ready", progress: 0 });
    }
    if (accepted.length) setFormData((prev) => ({ ...prev, documents: [...prev.documents, ...accepted.map((item) => item.file)], documentDrafts: [...(prev.documentDrafts ?? []), ...accepted] }));
  };
  const removeDocumentDraft = (id: string) => setFormData((prev) => { const next=(prev.documentDrafts ?? []).filter((item)=>item.id!==id); return {...prev, documents:next.map((item)=>item.file), documentDrafts:next}; });
  const updateDocumentDraft = (id: string, patch: Partial<ListingDocumentDraft>) => setFormData((prev) => ({...prev, documentDrafts:(prev.documentDrafts ?? []).map((item)=>item.id===id?{...item,...patch}:item)}));
  const openExistingDocument = async (doc: ListingDocumentAsset) => { try { const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.storagePath, 300); if (error) throw error; if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to open document."); } };
  const removeExistingDocument = (doc: ListingDocumentAsset) => {
    setExistingDocuments((items) => items.filter((item) => item.id !== doc.id));
    toast.success("Document marked for removal. Save the listing to apply the change.");
  };

  const allCount = existingImages.length + drafts.length;

  return <section className="space-y-6 rounded-xl border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
    <div>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-aviation-primary"><ImagePlus size={16}/> Listing media</div>
      <h2 className="mt-2 text-2xl font-bold text-aviation-dark">Images & supporting files</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-aviation-muted">Manage the complete listing asset set. Existing images remain visible during edits; new files are validated before they enter the upload queue.</p>
    </div>

    <div onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }} onDrop={(e) => { e.preventDefault(); setDragActive(false); validateAndAdd(Array.from(e.dataTransfer.files)); }} className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${dragActive ? "border-aviation-primary bg-aviation-light" : "border-aviation-border bg-aviation-light/60"}`}>
      <UploadCloud className="mx-auto text-aviation-primary" size={28}/>
      <h3 className="mt-3 font-bold text-aviation-dark">Drag photos here</h3>
      <p className="mt-1 text-sm text-aviation-muted">JPG, PNG or WebP · maximum 8 MB per image</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-aviation-dark px-5 text-sm font-semibold text-white">Choose photos</button>
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { validateAndAdd(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }}/>
    </div>

    {uploadProgress && uploadProgress.total > 0 && <div className="rounded-xl border border-aviation-primary/20 bg-aviation-light p-4" aria-live="polite"><div className="flex items-center justify-between text-xs font-semibold"><span className="text-aviation-dark">Uploading listing assets</span><span className="font-mono text-aviation-primary">{Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-aviation-primary transition-all" style={{ width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%` }}/></div><p className="mt-2 text-xs text-aviation-muted">{uploadProgress.completed} of {uploadProgress.total} files completed. Upload progress is tracked by completed file, not estimated bytes.</p></div>}

    {allCount === 0 && <div className="rounded-xl border border-dashed border-aviation-border p-6 text-center text-sm text-aviation-muted">No listing images yet. Add at least one clear primary image for the strongest buyer presentation.</div>}

    {existingImages.length > 0 && <AssetGroup title="Existing images" description="These files are already stored with this listing and remain editable." icon={<FileText size={16}/>}>{existingImages.map((asset, index) => <ExistingImageCard key={asset.id} asset={asset} index={index} onPrimary={() => setExistingPrimary(asset.id)} onRemove={() => void removeExisting(asset)} onAlt={(value) => setExistingImages((items) => items.map((item) => item.id === asset.id ? { ...item, altText: value } : item))} onMove={(direction) => setExistingImages((items) => { const list=[...items]; const next=index+direction; if(next<0||next>=list.length)return items; [list[index],list[next]]=[list[next],list[index]]; return list.map((item,i)=>({...item,sortOrder:i,isPrimary:i===0})); })}/>)}</AssetGroup>}

    {drafts.length > 0 && <AssetGroup title="New photos" description="These are local until the listing is saved. They will be uploaded with the draft/publish action." icon={<ImagePlus size={16}/>}>{drafts.map((draft, index) => <DraftImageCard key={draft.id} draft={draft} index={index} total={drafts.length} onRemove={() => removeDraft(draft.id)} onMove={(direction) => moveDraft(draft.id, direction)} onAlt={(value) => updateAlt(draft.id, value)} onPrimary={() => setDraftPrimary(draft.id)}/>)}</AssetGroup>}

    <div className="rounded-xl border border-aviation-border bg-aviation-light/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-aviation-dark">Supporting documents</h3><p className="mt-1 text-xs leading-5 text-aviation-muted">General listing files are separate from certification verification records. Existing files remain visible during editing.</p></div><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-aviation-primary bg-white px-4 text-xs font-bold text-aviation-primary"><FileText size={15}/> Add files<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" className="sr-only" onChange={(e)=>{addDocuments(Array.from(e.target.files??[]));e.currentTarget.value="";}}/></label></div>
      {existingDocuments.length>0 && <div className="mt-4 space-y-2">{existingDocuments.map((doc)=><div key={doc.id} className="flex flex-col gap-3 rounded-lg border border-aviation-border bg-white p-3 sm:flex-row sm:items-center"><FileText size={17} className="shrink-0 text-aviation-primary"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" title={doc.filename}>{doc.filename}</p><p className="mt-1 text-xs text-aviation-muted">{doc.documentType} · {doc.uploadStatus}</p></div><div className="flex gap-2"><button type="button" onClick={()=>void openExistingDocument(doc)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-aviation-border px-3 text-xs font-semibold text-aviation-primary">View</button><button type="button" onClick={()=>void removeExistingDocument(doc)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-aviation-error/30 px-3 text-xs font-semibold text-aviation-error"><Trash2 size={14}/> Remove</button></div></div>)}</div>}
      {documentDrafts.length>0 && <div className="mt-4 space-y-2">{documentDrafts.map((doc)=><div key={doc.id} className="grid gap-3 rounded-lg border border-aviation-border bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"><input value={doc.file.name} readOnly className="min-h-10 rounded-lg border border-aviation-border bg-aviation-light px-3 text-xs"/><select value={doc.documentType} onChange={(e)=>updateDocumentDraft(doc.id,{documentType:e.target.value})} className="min-h-10 rounded-lg border border-aviation-border px-3 text-xs"><option>Supporting document</option><option>Maintenance record</option><option>Traceability record</option><option>Inspection report</option><option>Other</option></select><button type="button" onClick={()=>removeDocumentDraft(doc.id)} className="min-h-10 rounded-lg border border-aviation-error/30 px-3 text-xs font-semibold text-aviation-error"><Trash2 size={14}/></button></div>)}</div>}
    </div>

    <div className="flex gap-3 rounded-xl border border-aviation-warning/25 bg-aviation-warning-soft p-4 text-xs leading-5 text-aviation-muted"><Star size={16} className="mt-0.5 shrink-0 text-aviation-warning"/><span><strong className="text-aviation-dark">Primary image:</strong> the first image in the final order is the marketplace hero image. Use the reorder controls to make the desired photo first.</span></div>
  </section>;
}

function AssetGroup({title,description,icon,children}:{title:string;description:string;icon:React.ReactNode;children:React.ReactNode}){return <div><div className="mb-3 flex items-start gap-3"><div className="mt-0.5 text-aviation-primary">{icon}</div><div><h3 className="font-bold text-aviation-dark">{title}</h3><p className="text-xs leading-5 text-aviation-muted">{description}</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></div>}
function ExistingImageCard({asset,index,onPrimary,onRemove,onAlt,onMove}:{asset:ListingImageAsset;index:number;onPrimary:()=>void;onRemove:()=>void;onAlt:(value:string)=>void;onMove:(direction:-1|1)=>void}){return <article className="overflow-hidden rounded-xl border border-aviation-border bg-white"><div className="relative aspect-[4/3] bg-aviation-light"><img src={asset.publicUrl} alt={asset.altText || asset.filename} className="h-full w-full object-contain p-2"/><span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase text-aviation-success">Stored</span></div><div className="space-y-3 p-3"><div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-xs font-semibold" title={asset.filename}>{asset.filename}</span>{asset.isPrimary && <span className="shrink-0 rounded-full bg-aviation-primary/10 px-2 py-1 text-[10px] font-bold text-aviation-primary">PRIMARY</span>}</div><label className="block"><span className="text-[10px] font-bold uppercase tracking-wide text-aviation-muted">Alt text</span><input value={asset.altText} onChange={(e)=>onAlt(e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-aviation-border px-3 text-xs" placeholder="Describe the part image"/></label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={()=>onMove(-1)} disabled={index===0} className="min-h-10 rounded-lg border border-aviation-border text-xs font-semibold disabled:opacity-40" aria-label="Move image earlier">↑</button><button type="button" onClick={onPrimary} className="min-h-10 rounded-lg border border-aviation-border text-xs font-semibold">{asset.isPrimary?"Primary":"Set primary"}</button><button type="button" onClick={()=>onMove(1)} className="min-h-10 rounded-lg border border-aviation-border text-xs font-semibold" aria-label="Move image later">↓</button></div><button type="button" onClick={onRemove} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-aviation-error/30 text-xs font-semibold text-aviation-error"><Trash2 size={14}/> Remove existing image</button></div></article>}
function DraftImageCard({draft,index,total,onRemove,onMove,onAlt,onPrimary}:{draft:ListingImageDraft;index:number;total:number;onRemove:()=>void;onMove:(direction:-1|1)=>void;onAlt:(value:string)=>void;onPrimary:()=>void}){return <article className="overflow-hidden rounded-xl border border-aviation-border bg-white"><div className="relative aspect-[4/3] bg-aviation-light"><img src={draft.previewUrl} alt={draft.altText || draft.filename} className="h-full w-full object-contain p-2"/><span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase text-aviation-warning">Ready to upload</span></div><div className="space-y-3 p-3"><div className="truncate text-xs font-semibold" title={draft.filename}>{draft.filename}</div><label className="block"><span className="text-[10px] font-bold uppercase tracking-wide text-aviation-muted">Alt text</span><input value={draft.altText} onChange={(e)=>onAlt(e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-aviation-border px-3 text-xs" placeholder="Describe the part image"/></label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={()=>onMove(-1)} disabled={index===0} className="min-h-10 rounded-lg border border-aviation-border text-xs font-semibold disabled:opacity-40">↑</button><button type="button" onClick={onPrimary} className={`flex min-h-10 items-center justify-center rounded-lg border px-2 text-[10px] font-bold uppercase ${draft.isPrimary ? "border-aviation-primary bg-aviation-primary/10 text-aviation-primary" : "border-aviation-border bg-aviation-light text-aviation-muted"}`}>{draft.isPrimary ? "Primary" : "Set primary"}</button><button type="button" onClick={()=>onMove(1)} disabled={index===total-1} className="min-h-10 rounded-lg border border-aviation-border text-xs font-semibold disabled:opacity-40">↓</button></div><button type="button" onClick={onRemove} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-aviation-error/30 text-xs font-semibold text-aviation-error"><X size={14}/> Remove from upload queue</button></div></article>}

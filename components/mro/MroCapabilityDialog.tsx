"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2, Plus, Trash2, Wrench, X } from "lucide-react";
import {
  MAX_OEM_APPROVALS,
  MRO_APPROVAL_GROUP_TITLES,
  MRO_APPROVAL_OPTIONS,
  MRO_CAPABILITY_GROUPS,
  validateMroProfile,
  type MroApproval,
  type MroProfile,
} from "@/lib/mro-form";

const inputClass = "h-10 w-full rounded-md border border-aviation-border bg-white px-3 text-sm outline-none transition focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20 sm:h-9";
const textareaClass = "w-full rounded-md border border-aviation-border bg-white px-3 py-2 text-sm outline-none focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20";

/** A dropdown that lets you pick several options; closed, it shows a short summary. */
function MultiSelect({ id, options, value, onChange, placeholder = "Select…" }: { id: string; options: { key: string; label: string }[]; value: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chosen = options.filter((option) => value.includes(option.key));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const toggle = (key: string) => onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  const optionKeys = options.map((option) => option.key);
  const allChosen = chosen.length === options.length;
  const summary = chosen.length === 0 ? placeholder
    : chosen.length <= 2 ? chosen.map((option) => option.label).join(", ")
    : `${chosen.length} selected — ${chosen[0].label}, +${chosen.length - 1} more`;

  return (
    <div ref={rootRef} className="relative" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); } }}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{ minHeight: 0 }}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-white pl-3 pr-2 text-left text-sm outline-none transition focus:ring-2 focus:ring-aviation-primary/20 ${open ? "border-aviation-primary" : "border-aviation-border hover:border-aviation-primary/60"}`}
      >
        <span className={`truncate ${chosen.length ? "text-aviation-dark" : "text-[var(--aviation-muted)]"}`}>{summary}</span>
        <ChevronDown size={16} className={`shrink-0 text-aviation-dark transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-aviation-border bg-white py-1 shadow-lg">
          <div className="flex items-center justify-between border-b border-aviation-border px-3 py-1.5 text-xs">
            <span className="text-[var(--aviation-muted)]">{chosen.length} of {options.length} selected</span>
            <button type="button" style={{ minHeight: 0 }} onClick={() => onChange(allChosen ? value.filter((v) => !optionKeys.includes(v)) : [...new Set([...value, ...optionKeys])])} className="font-semibold text-aviation-primary hover:underline">
              {allChosen ? "Clear all" : "Select all"}
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const selected = value.includes(option.key);
              return (
                <li key={option.key} role="option" aria-selected={selected}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm leading-5 text-aviation-dark hover:bg-aviation-light">
                    <input type="checkbox" checked={selected} onChange={() => toggle(option.key)} className="h-4 w-4 shrink-0 accent-[var(--aviation-primary)]" />
                    <span className="min-w-0">{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div className="grid gap-x-5 gap-y-1 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
      <LabelTag {...(htmlFor ? { htmlFor } : {})} className="text-sm font-semibold leading-5 text-aviation-dark sm:pt-2">{label}</LabelTag>
      <div className="min-w-0">{children}{hint && <p className="mt-1 text-xs italic text-[var(--aviation-muted)]">{hint}</p>}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="rounded-md bg-aviation-light px-3 py-1.5 text-sm font-bold text-aviation-primary">{children}</h3>;
}

/** Certificate number, expiry and scope for one approval. */
function ApprovalFields({ approval, nameEditable, onChange, onRemove }: { approval: MroApproval; nameEditable: boolean; onChange: (next: MroApproval) => void; onRemove?: () => void }) {
  const baseId = useId();
  return (
    <div className="rounded-md border border-aviation-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        {nameEditable
          ? <input aria-label="Authorization name" value={approval.name} onChange={(e) => onChange({ ...approval, name: e.target.value })} placeholder={approval.group === "oem" ? "Authorization name, e.g. Collins Aerospace authorised repair" : "Authority and approval, e.g. SACAA AMO"} className={inputClass} maxLength={120} />
          : <p className="text-sm font-semibold text-aviation-dark">{approval.name}</p>}
        {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${approval.name || "authorization"}`} className="shrink-0 rounded-md p-2 text-[var(--aviation-muted)] hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_150px_minmax(0,1.4fr)]">
        <div><label htmlFor={`${baseId}-cert`} className="text-xs font-medium text-[var(--aviation-muted)]">Certificate no.</label><input id={`${baseId}-cert`} value={approval.certificateNo} onChange={(e) => onChange({ ...approval, certificateNo: e.target.value })} className={inputClass} maxLength={80} /></div>
        <div><label htmlFor={`${baseId}-expiry`} className="text-xs font-medium text-[var(--aviation-muted)]">Expiry date</label><input id={`${baseId}-expiry`} type="date" value={approval.expiry} onChange={(e) => onChange({ ...approval, expiry: e.target.value })} className={inputClass} /></div>
        <div className="col-span-2 sm:col-span-1"><label htmlFor={`${baseId}-scope`} className="text-xs font-medium text-[var(--aviation-muted)]">Ratings and scope</label><input id={`${baseId}-scope`} value={approval.scope} onChange={(e) => onChange({ ...approval, scope: e.target.value })} className={inputClass} maxLength={500} /></div>
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  initial: MroProfile;
  title?: string;
  intro?: string;
  submitLabel: string;
  onClose: () => void;
  /** Return an error message to keep the form open, or nothing when saved. */
  onSubmit: (profile: MroProfile) => Promise<string | void> | string | void;
};

/** The MRO Capabilities & Approvals form, on one page, in a pop-up. */
export default function MroCapabilityDialog({ open, initial, title = "MRO Capabilities & Approvals", intro, submitLabel, onClose, onSubmit }: Props) {
  const [profile, setProfile] = useState<MroProfile>(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Start from the latest saved answers each time the pop-up opens.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { setProfile(initial); setProblems([]); }
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [open, onClose, saving]);

  if (!open) return null;

  const set = <K extends keyof MroProfile>(key: K, value: MroProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const approvalsIn = (group: MroApproval["group"]) => profile.approvals.filter((a) => a.group === group);
  const replaceApproval = (target: MroApproval, next: MroApproval) => set("approvals", profile.approvals.map((a) => (a === target ? next : a)));
  const removeApproval = (target: MroApproval) => set("approvals", profile.approvals.filter((a) => a !== target));

  function chooseApprovals(group: "regulatory" | "quality", keys: string[]) {
    const kept = profile.approvals.filter((a) => a.group !== group || keys.includes(a.key));
    const added = keys
      .filter((key) => !kept.some((a) => a.group === group && a.key === key))
      .map((key) => {
        const option = MRO_APPROVAL_OPTIONS[group].find((o) => o.key === key)!;
        return { group, key, name: key === "other-authority" ? "" : option.name, certificateNo: "", expiry: "", scope: "" };
      });
    set("approvals", [...kept, ...added]);
  }

  function addOem() {
    const used = new Set(approvalsIn("oem").map((a) => a.key));
    let n = 1;
    while (used.has(`oem-${n}`)) n += 1;
    set("approvals", [...profile.approvals, { group: "oem", key: `oem-${n}`, name: "", certificateNo: "", expiry: "", scope: "" }]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateMroProfile(profile);
    setProblems(found);
    if (found.length) {
      panelRef.current?.querySelector("[data-problems]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    setSaving(true);
    const error = await onSubmit(profile);
    setSaving(false);
    if (error) setProblems([error]);
  }

  const componentGroups = MRO_CAPABILITY_GROUPS.filter((g) => g.section === "components");
  const otherGroups = MRO_CAPABILITY_GROUPS.filter((g) => g.section === "other");
  const capabilityRow = (g: (typeof MRO_CAPABILITY_GROUPS)[number]) => (
    <Row key={g.key} label={g.title} htmlFor={`mro-${g.key}`}>
      <MultiSelect id={`mro-${g.key}`} options={g.items} value={profile.capabilities} onChange={(next) => set("capabilities", next)} />
    </Row>
  );

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-stretch justify-center bg-[#04182b]/60 sm:items-center sm:p-6" onPointerDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={headingId} className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white text-aviation-dark shadow-2xl outline-none sm:h-auto sm:max-h-[92vh] sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 bg-[#0f5b6b] px-5 py-4 text-white">
          <div className="flex gap-3">
            <Wrench size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 id={headingId} className="text-lg font-bold">{title}</h2>
              <p className="mt-0.5 text-xs leading-5 text-white/80">{intro ?? "Tell us what your organisation can maintain, repair or overhaul, and which approvals you hold."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md p-1.5 hover:bg-white/15"><X size={18} /></button>
        </div>

        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section className="space-y-3">
              <h3 className="text-base font-bold text-aviation-dark">1. Capabilities</h3>
              <SectionTitle>Components</SectionTitle>
              <p className="text-xs italic text-[var(--aviation-muted)]">Select each item you repair or overhaul under your own approval.</p>
              <div className="space-y-3">{componentGroups.map(capabilityRow)}</div>
              <Row label="Notes or limitations" htmlFor="mro-notes" hint="Aircraft types, ratings or limits that apply to the components above.">
                <textarea id="mro-notes" rows={2} value={profile.componentNotes} onChange={(e) => set("componentNotes", e.target.value)} className={textareaClass} maxLength={2000} />
              </Row>
              <SectionTitle>Structures, support and maintenance</SectionTitle>
              <div className="space-y-3">{otherGroups.map(capabilityRow)}</div>
              <SectionTitle>Aircraft and facilities</SectionTitle>
              <div className="space-y-3">
                <Row label="Aircraft types you support" htmlFor="mro-aircraft">
                  <textarea id="mro-aircraft" rows={2} value={profile.aircraftTypes} onChange={(e) => set("aircraftTypes", e.target.value)} placeholder="e.g. A320 family, B737NG, ATR 72, Dash 8" className={textareaClass} maxLength={1000} />
                </Row>
                <Row label="Typical AOG response time" htmlFor="mro-aog">
                  <div className="flex items-center gap-2">
                    <input id="mro-aog" type="number" inputMode="decimal" min={0} step="0.5" value={profile.aogResponseHours} onChange={(e) => set("aogResponseHours", e.target.value)} className={`${inputClass} max-w-[140px]`} />
                    <span className="text-sm text-[var(--aviation-muted)]">hours</span>
                  </div>
                </Row>
                <Row label="Other locations or line stations" htmlFor="mro-locations">
                  <input id="mro-locations" value={profile.otherLocations} onChange={(e) => set("otherLocations", e.target.value)} placeholder="e.g. Mombasa (MBA), Entebbe (EBB)" className={inputClass} maxLength={1000} />
                </Row>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-aviation-dark">2. Approvals</h3>
              {(["regulatory", "quality"] as const).map((group) => (
                <div key={group} className="space-y-3">
                  <SectionTitle>{MRO_APPROVAL_GROUP_TITLES[group]}</SectionTitle>
                  <Row label="Approvals you hold" htmlFor={`mro-approvals-${group}`} hint="Add the certificate number, expiry date and scope for each one.">
                    <MultiSelect
                      id={`mro-approvals-${group}`}
                      options={MRO_APPROVAL_OPTIONS[group].map((o) => ({ key: o.key, label: o.name }))}
                      value={approvalsIn(group).map((a) => a.key)}
                      onChange={(keys) => chooseApprovals(group, keys)}
                      placeholder="None selected"
                    />
                  </Row>
                  {approvalsIn(group).map((approval) => (
                    <ApprovalFields key={approval.key} approval={approval} nameEditable={approval.key === "other-authority"} onChange={(next) => replaceApproval(approval, next)} onRemove={() => removeApproval(approval)} />
                  ))}
                </div>
              ))}
              <SectionTitle>{MRO_APPROVAL_GROUP_TITLES.oem}</SectionTitle>
              {approvalsIn("oem").map((approval) => (
                <ApprovalFields key={approval.key} approval={approval} nameEditable onChange={(next) => replaceApproval(approval, next)} onRemove={() => removeApproval(approval)} />
              ))}
              {approvalsIn("oem").length < MAX_OEM_APPROVALS && (
                <button type="button" onClick={addOem} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-aviation-primary/50 px-3 text-sm font-semibold text-aviation-primary hover:bg-aviation-light">
                  <Plus size={15} /> Add OEM authorization
                </button>
              )}
              <p className="text-xs italic text-[var(--aviation-muted)]">You can upload copies of your certificates from Account settings after your account is set up.</p>
            </section>
          </div>

          <div className="border-t border-aviation-border bg-white px-5 py-3">
            {problems.length > 0 && (
              <ul data-problems role="alert" className="mb-3 list-disc space-y-0.5 rounded-md bg-red-50 py-2 pl-8 pr-3 text-xs font-medium text-red-700">
                {[...new Set(problems)].map((problem) => <li key={problem}>{problem}</li>)}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="hidden text-xs text-[var(--aviation-muted)] sm:block">{profile.capabilities.length} capabilities · {profile.approvals.length} approvals</p>
              <div className="flex flex-1 gap-2 sm:flex-none">
                <button type="button" onClick={onClose} disabled={saving} className="h-10 flex-1 rounded-md sm:flex-none border border-aviation-border bg-white px-4 text-sm font-semibold text-aviation-dark hover:border-aviation-primary sm:h-9">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex h-10 flex-[2] items-center justify-center gap-2 rounded-md bg-aviation-primary px-3 sm:px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 sm:h-9">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} className="hidden sm:block" />}<span className="whitespace-nowrap">{submitLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

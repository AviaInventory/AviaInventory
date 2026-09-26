"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  Cog,
  Cpu,
  Droplets,
  Gauge,
  Plane,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface Suggestion {
  id: string;
  partNumber: string;
  description: string;
  category: string;
}

const icons: Record<string, typeof Plane> = {
  Airframes: Plane,
  Engines: Cog,
  Avionics: Cpu,
  Components: Boxes,
  "Landing Gear": Gauge,
  Consumables: Droplets,
  Electrical: Zap,
  "Safety Equipment": ShieldCheck,
};

function CategoryIcon({ category }: { category: string }) {
  const Icon = icons[category] ?? Boxes;
  return <Icon size={18} aria-hidden="true" />;
}

interface Props {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showSearchIcon?: boolean;
  fullSearchPath?: string;
}

export default function PartSearchAutocomplete({
  value: controlledValue,
  onValueChange,
  placeholder = "Search part number, manufacturer or NSN…",
  className = "",
  inputClassName = "",
  showSearchIcon = true,
  fullSearchPath = "/marketplace",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const value = controlledValue ?? internalValue;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    requestRef.current?.abort();
    setActiveIndex(-1);

    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const response = await fetch(`/api/marketplace/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const result = await response.json();
        setSuggestions(Array.isArray(result.suggestions) ? result.suggestions.slice(0, 8) : []);
        setOpen(true);
      } catch (error) {
        if ((error as DOMException)?.name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
  }, [value]);

  function updateValue(next: string) {
    if (onValueChange) onValueChange(next);
    else setInternalValue(next);
    setOpen(next.trim().length >= 2);
  }

  function runFullSearch() {
    const query = value.trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`${fullSearchPath}${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(false);
  }

  function selectSuggestion(suggestion: Suggestion) {
    setOpen(false);
    router.push(`/marketplace/${suggestion.id}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) selectSuggestion(suggestions[activeIndex]);
      else runFullSearch();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const listboxId = `${pathname.replace(/[^a-z0-9]/gi, "-")}-part-suggestions`;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <div className="relative flex min-w-0 items-center">
        {showSearchIcon && <Search className="pointer-events-none absolute left-4 z-10 text-aviation-muted" size={20} />}
        <input
          type="search"
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          className={`min-w-0 flex-1 rounded-xl border border-aviation-border bg-white py-3.5 pr-4 outline-none transition focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20 ${showSearchIcon ? "pl-12" : "pl-4"} ${inputClassName}`}
        />
        {loading && <span className="pointer-events-none absolute right-4 h-4 w-4 animate-spin rounded-full border-2 border-aviation-border border-t-aviation-primary" aria-label="Loading suggestions" />}
      </div>

      {open && (suggestions.length > 0 || (value.trim().length >= 2 && !loading)) && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[60] overflow-hidden rounded-xl border border-aviation-border bg-white shadow-[var(--aviation-shadow-xl)]">
          {suggestions.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label="Part suggestions" className="max-h-[min(520px,70vh)] overflow-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id} id={`${listboxId}-${index}`} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={`/marketplace/${suggestion.id}`}
                    onClick={(event) => { event.preventDefault(); selectSuggestion(suggestion); }}
                    className={`flex min-w-0 items-center gap-3 px-4 py-3 transition ${index === activeIndex ? "bg-aviation-light" : "hover:bg-aviation-light"}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aviation-success-soft text-aviation-primary">
                      <CategoryIcon category={suggestion.category} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-semibold text-aviation-primary">{suggestion.partNumber}</span>
                      <span className="mt-0.5 block truncate text-sm text-aviation-muted">{suggestion.description}</span>
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-aviation-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-aviation-muted sm:inline-flex">{suggestion.category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-4 text-sm text-aviation-muted">No matching parts. Press Enter to run the full search.</div>
          )}
          {suggestions.length > 0 && <div className="border-t bg-aviation-light px-4 py-2 text-[11px] text-aviation-muted">Use ↑ ↓ to navigate · Enter to select · Enter with no selection searches all inventory</div>}
        </div>
      )}
    </div>
  );
}

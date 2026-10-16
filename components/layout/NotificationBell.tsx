"use client";

import Link from "next/link";
import { Bell, CheckCheck, FileText, MessageSquare, Package, ShieldCheck, Tag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const POLL_MS = 60_000;

const TYPE_ICONS: Record<string, typeof Bell> = {
  rfq: FileText,
  quote: Tag,
  order: Package,
  message: MessageSquare,
  verification: ShieldCheck,
};

export function timeAgo(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [list, count] = await Promise.all([
      supabase.from("notifications").select("id,type,title,message,link,is_read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    ]);
    if (!list.error) setItems((list.data ?? []) as NotificationRow[]);
    if (!count.error) setUnread(count.count ?? 0);
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Defer the first fetch so it runs after mount, not during render.
    const first = setTimeout(load, 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(first); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => { if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // The row is a real link, so navigation never waits on (or fails with) the read update.
  function markRead(item: NotificationRow) {
    setOpen(false);
    if (item.is_read) return;
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, is_read: true } : row)));
    setUnread((count) => Math.max(0, count - 1));
    void supabase.from("notifications").update({ is_read: true }).eq("id", item.id);
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setItems((current) => current.map((row) => ({ ...row, is_read: true })));
    setUnread(0);
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((value) => !value); if (!open) load(); }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#16324f] hover:bg-[#f2f7fc] hover:text-[#0d5bd7]"
      >
        <Bell size={20} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#d92d20] px-1 text-[10px] font-bold leading-[18px] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[80px] z-[110] overflow-hidden rounded-2xl border border-[#dbe5ef] bg-white shadow-[0_18px_50px_rgba(6,35,63,0.18)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[380px]">
          <div className="flex items-center justify-between gap-3 border-b border-[#dbe5ef] px-4 py-3">
            <p className="text-sm font-bold text-[#12304d]">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d5bd7] hover:underline">
                <CheckCheck size={14} /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[min(70vh,460px)] overflow-y-auto">
            {!loaded ? (
              <div className="space-y-2 p-4" aria-busy="true">
                {[0, 1, 2].map((key) => <div key={key} className="h-14 animate-pulse rounded-xl bg-[#f2f7fc]" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Bell size={22} className="mx-auto text-[#8aa0b6]" />
                <p className="mt-3 text-sm font-semibold text-[#12304d]">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-[#58708a]">New RFQs, quotations, orders and messages will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#eef3f8]">
                {items.map((item) => {
                  const Icon = TYPE_ICONS[item.type] ?? Bell;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.link || "/account/notifications"}
                        onClick={() => markRead(item)}
                        className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-[#f7fafd] ${item.is_read ? "" : "bg-[#f2f7ff]"}`}
                      >
                        <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.is_read ? "bg-[#f2f7fc] text-[#58708a]" : "bg-[#e3eeff] text-[#0d5bd7]"}`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`text-sm ${item.is_read ? "font-medium text-[#16324f]" : "font-bold text-[#12304d]"}`}>{item.title}</span>
                            {!item.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0d5bd7]" aria-label="Unread" />}
                          </span>
                          {item.message && <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#58708a]">{item.message}</span>}
                          <span className="mt-1 block text-[11px] text-[#8aa0b6]">{timeAgo(item.created_at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-[#dbe5ef] px-4 py-2.5 text-center">
            <Link href="/account/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-[#0d5bd7] hover:underline">
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

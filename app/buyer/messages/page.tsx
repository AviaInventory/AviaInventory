"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { getBuyerRFQs, getRFQMessages, formatDate, type RFQ, type RFQMessage } from "@/lib/rfqs";
import RFQMessageThread from "@/components/buyer/rfq/RFQMessageThread";
import EmptyState from "@/components/dashboard/EmptyState";

/** One buyer ↔ supplier thread about one RFQ (a broadcast RFQ can have several). */
interface Conversation {
  key: string;
  rfq: RFQ;
  supplierId: string;
  supplierName: string;
  latestMessage: RFQMessage;
  unreadCount: number;
}

export default function BuyerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [{ data: { user } }, rfqs] = await Promise.all([supabase.auth.getUser(), getBuyerRFQs()]);
        if (!user) return;

        const perRfq = await Promise.all(rfqs.map(async (rfq) => ({ rfq, messages: await getRFQMessages(rfq.id) })));

        const threads = new Map<string, Conversation>();
        for (const { rfq, messages } of perRfq) {
          for (const message of messages) {
            const outgoing = message.sender_id === user.id;
            const supplierId = outgoing ? message.recipient_id : message.sender_id;
            const supplier = outgoing ? message.recipient : message.sender;
            const key = `${rfq.id}:${supplierId}`;
            const thread = threads.get(key) ?? {
              key,
              rfq,
              supplierId,
              supplierName: supplier?.company_name || supplier?.full_name || "Supplier",
              latestMessage: message,
              unreadCount: 0,
            };
            if (new Date(message.created_at) > new Date(thread.latestMessage.created_at)) thread.latestMessage = message;
            // Only messages sent to the buyer can be unread by the buyer.
            if (!outgoing && !message.is_read) thread.unreadCount += 1;
            threads.set(key, thread);
          }
        }

        const sorted = [...threads.values()].sort(
          (a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime(),
        );
        if (!active) return;
        setConversations(sorted);
        setSelectedKey((current) => current ?? sorted[0]?.key ?? null);
      } catch (err) {
        console.error("GET BUYER MESSAGES ERROR:", err);
        if (active) setError("We couldn't load your messages. Please refresh the page.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const selected = conversations.find((conversation) => conversation.key === selectedKey) ?? null;

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--aviation-muted)]">Supplier conversations</p>
        <h1 className="mt-1 text-3xl font-bold text-aviation-primary">Messages</h1>
        <p className="mt-1 text-sm text-[var(--aviation-muted)]">Questions and replies with suppliers about your RFQs.</p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-aviation-border bg-white p-10 text-center text-[var(--aviation-muted)]">Loading messages…</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl bg-aviation-error-soft p-6 text-aviation-error">
          {error}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="When you message a supplier about a quotation, or a supplier writes to you about an RFQ, the conversation appears here."
          actionLabel="View my RFQs"
          actionHref="/buyer/rfqs"
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <nav aria-label="Conversations" className="space-y-2">
            {conversations.map((conversation) => {
              const active = conversation.key === selectedKey;
              return (
                <button
                  key={conversation.key}
                  type="button"
                  onClick={() => setSelectedKey(conversation.key)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active ? "border-aviation-primary bg-aviation-success-soft" : "border-aviation-border bg-white hover:border-aviation-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-aviation-dark">{conversation.supplierName}</p>
                      <p className="truncate text-xs text-[var(--aviation-muted)]">
                        RFQ #{conversation.rfq.id.slice(0, 8).toUpperCase()}
                        {conversation.rfq.part_number ? ` · ${conversation.rfq.part_number}` : ""}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-aviation-primary px-2 text-xs font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--aviation-muted)]">{conversation.latestMessage.message}</p>
                  <p className="mt-1 text-xs text-[var(--aviation-muted)]">{formatDate(conversation.latestMessage.created_at)}</p>
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 space-y-3">
            {selected && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-aviation-dark">
                    {selected.supplierName} · RFQ #{selected.rfq.id.slice(0, 8).toUpperCase()}
                  </p>
                  <Link href={`/buyer/rfqs/${selected.rfq.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-aviation-primary hover:underline">
                    Open RFQ <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
                <RFQMessageThread key={selected.key} rfqId={selected.rfq.id} supplierId={selected.supplierId} />
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

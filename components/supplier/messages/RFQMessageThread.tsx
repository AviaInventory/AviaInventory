"use client";

import { useEffect, useState } from "react";
import {
  getRFQMessages,
  sendRFQMessage,
  type RFQMessage,
} from "@/lib/rfqs";
import { Send, MessageSquare } from "lucide-react";

interface Props {
  rfqId: string;
  buyerId: string;
}

export default function RFQMessageThread({
  rfqId,
  buyerId,
}: Props) {
  const [messages, setMessages] = useState<
    RFQMessage[]
  >([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    loadMessages();
  }, [rfqId]);

  async function loadMessages() {
    try {
      setLoading(true);

      const data =
        await getRFQMessages(rfqId);

      setMessages(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!message.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      setSendError("");

      const result =
        await sendRFQMessage(
          rfqId,
          buyerId,
          message
        );

      if (!result.success) {
        console.error(
          "SEND MESSAGE ERROR:",
          result.error
        );
        setSendError(
          typeof result.error === "string"
            ? result.error
            : "Your message wasn't sent. Check your connection and try again."
        );

        return;
      }

      setMessage("");

      await loadMessages();
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow">

      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-aviation-success-soft p-3 text-aviation-primary">
          <MessageSquare size={22} />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-aviation-primary">
            Message Buyer
          </h3>

          <p className="mt-1 text-sm text-aviation-muted">
            Communicate with the buyer regarding this RFQ.
          </p>
        </div>

      </div>

      {/* Messages */}

      <div className="mt-8 max-h-[450px] space-y-4 overflow-y-auto rounded-xl border bg-aviation-light p-5">

        {loading ? (

          <p className="text-center text-aviation-muted">
            Loading messages...
          </p>

        ) : messages.length === 0 ? (

          <div className="py-10 text-center">

            <MessageSquare
              size={32}
              className="mx-auto text-aviation-muted"
            />

            <p className="mt-3 font-medium text-aviation-muted">
              No messages yet.
            </p>

            <p className="mt-1 text-sm text-aviation-muted">
              Start a conversation with the buyer.
            </p>

          </div>

        ) : (

          messages.map((item) => {
            const fromBuyer = item.sender_id === buyerId;

            return (
              <div key={item.id} className={`flex ${fromBuyer ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${fromBuyer ? "border bg-white" : "bg-aviation-primary text-white"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-sm font-semibold ${fromBuyer ? "text-aviation-primary" : "text-white"}`}>
                      {fromBuyer ? item.sender?.company_name || item.sender?.full_name || "Buyer" : "You"}
                    </p>
                    <p className={`text-xs ${fromBuyer ? "text-[var(--aviation-muted)]" : "text-aviation-light"}`}>
                      {new Date(item.created_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <p className={`mt-3 whitespace-pre-wrap leading-6 ${fromBuyer ? "text-aviation-dark" : "text-white"}`}>
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })

        )}

      </div>

      {/* Composer */}

      <div className="mt-6">

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Type your message to the buyer..."
          rows={4}
          className="w-full rounded-xl border border-aviation-border p-4 outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
        />

        {sendError && (
          <p role="alert" className="mt-3 rounded-lg bg-aviation-error-soft px-3 py-2 text-sm text-aviation-error">
            {sendError}
          </p>
        )}

        <div className="mt-3 flex justify-end">

          <button
            type="button"
            onClick={handleSend}
            disabled={
              sending || !message.trim()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Send size={18} />

            {sending
              ? "Sending..."
              : "Send Message"}

          </button>

        </div>

      </div>

    </section>
  );
}
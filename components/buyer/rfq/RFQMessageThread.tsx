"use client";

import { useEffect, useState } from "react";

import {
  getRFQMessages,
  sendRFQMessage,
  type RFQMessage,
} from "@/lib/rfqs";

import {
  Send,
  MessageSquare,
} from "lucide-react";

interface Props {
  rfqId: string;
  supplierId: string;
}

export default function RFQMessageThread({
  rfqId,
  supplierId,
}: Props) {
  const [messages, setMessages] =
    useState<RFQMessage[]>([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  /* ==========================================================
     LOAD MESSAGES
  ========================================================== */

  useEffect(() => {
    loadMessages();
  }, [rfqId, supplierId]);

  async function loadMessages() {
    try {
      setLoading(true);

      const data =
        await getRFQMessages(rfqId);

      /*
       * getRFQMessages returns all messages
       * belonging to this RFQ.
       *
       * Only display messages exchanged
       * between this buyer and this supplier.
       */

      const filtered = data.filter(
        (item) =>
          item.sender_id === supplierId ||
          item.recipient_id === supplierId
      );

      setMessages(filtered);
    } catch (error) {
      console.error(
        "GET BUYER RFQ MESSAGES ERROR:",
        error
      );

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     SEND MESSAGE
  ========================================================== */

  async function handleSend() {
    const trimmedMessage =
      message.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    try {
      setSending(true);

      const result =
        await sendRFQMessage(
          rfqId,
          supplierId,
          trimmedMessage
        );

      if (!result.success) {
        console.error(
          "SEND BUYER MESSAGE ERROR:",
          result.error
        );

        return;
      }

      setMessage("");

      await loadMessages();
    } catch (error) {
      console.error(
        "SEND BUYER MESSAGE ERROR:",
        error
      );
    } finally {
      setSending(false);
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-5">

      {/* ======================================================
         HEADER
      ====================================================== */}

      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-aviation-success-soft p-3 text-aviation-primary">
          <MessageSquare size={22} />
        </div>

        <div>

          <h3 className="text-xl font-bold text-aviation-primary">
            Message Supplier
          </h3>

          <p className="mt-1 text-sm text-aviation-muted">
            Communicate directly with this supplier
            regarding this RFQ.
          </p>

        </div>

      </div>

      {/* ======================================================
         MESSAGE LIST
      ====================================================== */}

      <div className="max-h-[400px] space-y-4 overflow-y-auto rounded-xl border bg-aviation-light p-5">

        {loading ? (

          <div className="py-8 text-center">

            <p className="text-aviation-muted">
              Loading messages...
            </p>

          </div>

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
              Start a conversation with this supplier.
            </p>

          </div>

        ) : (

          messages.map((item) => {

            const isSupplier =
              item.sender_id === supplierId;

            return (
              <div
                key={item.id}
                className={`flex ${
                  isSupplier
                    ? "justify-start"
                    : "justify-end"
                }`}
              >

                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    isSupplier
                      ? "border bg-white"
                      : "bg-aviation-primary text-white"
                  }`}
                >

                  {/* Sender / Date */}

                  <div className="flex items-center justify-between gap-4">

                    <p
                      className={`text-sm font-semibold ${
                        isSupplier
                          ? "text-aviation-primary"
                          : "text-white"
                      }`}
                    >
                      {isSupplier
                        ? "Supplier"
                        : "You"}
                    </p>

                    <p
                      className={`text-xs ${
                        isSupplier
                          ? "text-aviation-muted"
                          : "text-aviation-light"
                      }`}
                    >
                      {new Date(
                        item.created_at
                      ).toLocaleString("en-GB")}
                    </p>

                  </div>

                  {/* Message */}

                  <p
                    className={`mt-3 whitespace-pre-wrap leading-6 ${
                      isSupplier
                        ? "text-aviation-dark"
                        : "text-white"
                    }`}
                  >
                    {item.message}
                  </p>

                </div>

              </div>
            );
          })

        )}

      </div>

      {/* ======================================================
         MESSAGE COMPOSER
      ====================================================== */}

      <div>

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={(event) => {

            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();

              handleSend();
            }

          }}
          placeholder="Type your message to the supplier..."
          rows={4}
          disabled={sending}
          className="w-full resize-none rounded-xl border border-aviation-border p-4 outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary disabled:bg-aviation-light"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-aviation-muted">
            Press Enter to send.
            Use Shift + Enter for a new line.
          </p>

          <button
            type="button"
            onClick={handleSend}
            disabled={
              sending ||
              !message.trim()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Send size={18} />

            {sending
              ? "Sending..."
              : "Send Message"}

          </button>

        </div>

      </div>

    </div>
  );
}
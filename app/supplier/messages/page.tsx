"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

import { supabase } from "@/lib/supabase";
import RFQMessageThread from "@/components/supplier/messages/RFQMessageThread";

interface Message {
  id: string;
  rfq_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface RFQSummary {
  id: string;
  buyer_id: string;
  part_id: string | null;
  created_at: string;
  part?: {
    part_number: string | null;
    description: string | null;
  } | null;
}

interface Conversation {
  rfq: RFQSummary;
  messages: Message[];
  unreadCount: number;
}

export default function SupplierMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setConversations([]);
        return;
      }

      /*
       * Get messages where the supplier is either
       * the sender or recipient.
       */
      const { data: messageData, error: messageError } =
        await supabase
          .from("messages")
          .select("*")
          .or(
            `sender_id.eq.${user.id},recipient_id.eq.${user.id}`
          )
          .order("created_at", {
            ascending: true,
          });

      if (messageError) {
        console.error(
          "GET SUPPLIER MESSAGES ERROR:",
          messageError
        );

        setConversations([]);
        return;
      }

      const messages = (messageData ?? []) as Message[];

      if (messages.length === 0) {
        setConversations([]);
        return;
      }

      /*
       * Get the RFQs connected to the messages.
       */
      const rfqIds = [
        ...new Set(messages.map((message) => message.rfq_id)),
      ];

      const { data: rfqData, error: rfqError } =
        await supabase
          .from("rfqs")
          .select("id, buyer_id, part_id, created_at")
          .in("id", rfqIds)
          .eq("supplier_id", user.id);

      if (rfqError) {
        console.error(
          "GET MESSAGE RFQS ERROR:",
          rfqError
        );

        setConversations([]);
        return;
      }

      const rfqs = (rfqData ?? []) as RFQSummary[];

      const partIds = [...new Set(
        rfqs
          .map((rfq) => rfq.part_id)
          .filter((id): id is string => Boolean(id))
      )];

      if (partIds.length) {
        const { data: parts } = await supabase
          .from("parts")
          .select("id, part_number, description")
          .in("id", partIds);

        const partMap = new Map(
          (parts ?? []).map((part) => [part.id, part])
        );

        for (const rfq of rfqs) {
          rfq.part = rfq.part_id
            ? partMap.get(rfq.part_id) ?? null
            : null;
        }
      }

      /*
       * Group messages by RFQ.
       */
      const grouped = rfqs.map((rfq) => {
        const rfqMessages = messages.filter(
          (message) =>
            message.rfq_id === rfq.id
        );

        const unreadCount = rfqMessages.filter(
          (message) =>
            message.recipient_id === user.id &&
            !message.is_read
        ).length;

        return {
          rfq,
          messages: rfqMessages,
          unreadCount,
        };
      });

      setConversations(grouped);

      /*
       * Automatically select the first conversation.
       */
      if (grouped.length > 0 && !selectedRFQ) {
        setSelectedRFQ(grouped[0].rfq.id);
      }
    } catch (error) {
      console.error(
        "SUPPLIER MESSAGE LOAD ERROR:",
        error
      );

      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.rfq.id === selectedRFQ
    );

  return (
    <main className="min-h-screen bg-aviation-light">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">

        {/* Header */}

        <div>
          <h1 className="text-4xl font-bold text-aviation-primary">
            Messages
          </h1>

          <p className="mt-2 text-aviation-muted">
            Communicate with buyers regarding your RFQs and
            quotations.
          </p>
        </div>

        {/* Loading */}

        {loading ? (
          <section className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-aviation-muted">
              Loading messages...
            </p>
          </section>
        ) : conversations.length === 0 ? (
          /* Empty State */

          <section className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aviation-success-soft">
              <MessageSquare
                size={30}
                className="text-aviation-primary"
              />
            </div>

            <h2 className="mt-6 text-xl font-bold text-aviation-primary">
              No Messages Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-aviation-muted">
              Messages relating to your RFQs and quotations
              will appear here when buyers contact you.
            </p>
          </section>
        ) : (
          /* Messages */

          <section className="mt-8 grid min-h-[520px] overflow-hidden rounded-2xl border bg-white shadow-sm sm:min-h-[580px] lg:min-h-[650px] lg:grid-cols-[minmax(260px,350px)_minmax(0,1fr)]">

            {/* Conversation List */}

            <div className="border-r">

              <div className="border-b p-5">
                <h2 className="font-bold text-aviation-primary">
                  Conversations
                </h2>

                <p className="mt-1 text-sm text-aviation-muted">
                  {conversations.length} conversation
                  {conversations.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="divide-y">
                {conversations.map(
                  (conversation) => {
                    const active =
                      conversation.rfq.id ===
                      selectedRFQ;

                    const lastMessage =
                      conversation.messages[
                        conversation.messages.length - 1
                      ];

                    return (
                      <button
                        key={conversation.rfq.id}
                        type="button"
                        onClick={() =>
                          setSelectedRFQ(
                            conversation.rfq.id
                          )
                        }
                        className={`w-full p-5 text-left transition ${
                          active
                            ? "bg-aviation-success-soft"
                            : "hover:bg-aviation-light"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">
                            <p className="font-semibold text-aviation-primary">
                              RFQ #
                              {conversation.rfq.id
                                .slice(0, 8)
                                .toUpperCase()}
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-aviation-dark">
                              {conversation.rfq.part?.part_number ?? "Part request"}
                            </p>

                            <p className="mt-1 truncate text-xs text-aviation-muted">
                              {lastMessage?.message ||
                                "No message"}
                            </p>
                          </div>

                          {conversation.unreadCount >
                            0 && (
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-aviation-primary px-2 text-xs font-bold text-white">
                              {
                                conversation.unreadCount
                              }
                            </span>
                          )}

                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Message Thread */}

            <div className="min-w-0">
              {selectedConversation ? (
                <RFQMessageThread
                  rfqId={
                    selectedConversation.rfq.id
                  }
                  buyerId={
                    selectedConversation.rfq.buyer_id
                  }
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center sm:min-h-[500px] text-aviation-muted">
                  Select a conversation
                </div>
              )}
            </div>

          </section>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getBuyerRFQs,
  getRFQMessages,
  formatDate,
  type RFQ,
  type RFQMessage,
} from "@/lib/rfqs";

import { MessageSquare, ArrowRight } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";

interface Conversation {
  rfq: RFQ;
  messages: RFQMessage[];
  latestMessage?: RFQMessage;
  unreadCount: number;
}

export default function BuyerMessagesPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================================
     LOAD BUYER MESSAGES
  ========================================================== */

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      setError(null);

      const rfqs = await getBuyerRFQs();

      const results: Conversation[] = [];

      for (const rfq of rfqs) {
        try {
          const messages =
            await getRFQMessages(rfq.id);

          if (messages.length === 0) {
            continue;
          }

          const sortedMessages =
            [...messages].sort(
              (a, b) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            );

          /*
           * We do not need a separate messages table
           * query here. All messages are already linked
           * to the RFQ.
           */

          results.push({
            rfq,
            messages,
            latestMessage:
              sortedMessages[0],
            unreadCount:
              messages.filter(
                (message) =>
                  !message.is_read
              ).length,
          });
        } catch (messageError) {
          console.error(
            `GET MESSAGES ERROR FOR RFQ ${rfq.id}:`,
            messageError
          );
        }
      }

      /*
       * Show conversations with the newest
       * activity first.
       */

      results.sort((a, b) => {
        const aDate =
          a.latestMessage
            ? new Date(
                a.latestMessage.created_at
              ).getTime()
            : 0;

        const bDate =
          b.latestMessage
            ? new Date(
                b.latestMessage.created_at
              ).getTime()
            : 0;

        return bDate - aDate;
      });

      setConversations(results);
    } catch (err) {
      console.error(
        "GET BUYER MESSAGES ERROR:",
        err
      );

      setError(
        "Unable to load your messages."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-aviation-light p-6 lg:p-10">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

            <MessageSquare
              size={36}
              className="mx-auto text-aviation-muted"
            />

            <p className="mt-4 text-aviation-muted">
              Loading messages...
            </p>

          </div>

        </div>

      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <main className="min-h-screen bg-aviation-light p-6 lg:p-10">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

            <MessageSquare
              size={36}
              className="mx-auto text-aviation-light"
            />

            <h2 className="mt-4 text-xl font-bold text-aviation-dark">
              Unable to Load Messages
            </h2>

            <p className="mt-2 text-aviation-muted">
              {error}
            </p>

            <button
              type="button"
              onClick={loadMessages}
              className="mt-6 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white hover:bg-aviation-primary"
            >
              Try Again
            </button>

          </div>

        </div>

      </main>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-aviation-light p-6 lg:p-10">

      <div className="mx-auto max-w-7xl">

        {/* ====================================================
           PAGE HEADER
        ==================================================== */}

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-aviation-success-soft p-3 text-aviation-primary">
              <MessageSquare size={24} />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-aviation-primary">
                Messages
              </h1>

              <p className="mt-1 text-aviation-muted">
                Communicate with suppliers regarding
                your RFQs and quotations.
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
           EMPTY STATE
        ==================================================== */}

        {conversations.length === 0 ? (

          <div className="mt-8"><EmptyState icon={MessageSquare} eyebrow="NO CONVERSATIONS YET" title="Your message inbox is clear" description="Supplier conversations begin around RFQs. Create or review an RFQ to start procurement communication." actionLabel="Open RFQs" actionHref="/buyer/rfqs" /></div>

        ) : (

          /* ==================================================
             CONVERSATIONS
          ================================================== */

          <section className="mt-8 space-y-4">

            {conversations.map(
              (conversation) => {

                const {
                  rfq,
                  latestMessage,
                  unreadCount,
                } = conversation;

                const partNumber =
                  rfq.part?.part_number ??
                  rfq.part_number ??
                  "Custom RFQ";

                const preview =
                  latestMessage?.message ??
                  "No message";

                return (
                  <Link
                    key={rfq.id}
                    href={`/buyer/rfqs/${rfq.id}`}
                    className="group block"
                  >

                    <div
                      className={`rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        unreadCount > 0
                          ? "border-l-4 border-aviation-border"
                          : ""
                      }`}
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT */}

                        <div className="flex min-w-0 items-start gap-4">

                          <div className="rounded-xl bg-aviation-success-soft p-3 text-aviation-primary">

                            <MessageSquare
                              size={22}
                            />

                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-3">

                              <h2 className="font-bold text-aviation-primary">

                                {partNumber}

                              </h2>

                              {unreadCount > 0 && (

                                <span className="rounded-full bg-aviation-primary px-3 py-1 text-xs font-semibold text-white">

                                  {unreadCount} new
                                </span>

                              )}

                            </div>

                            <p className="mt-1 text-sm text-aviation-muted">

                              RFQ #
                              {rfq.id
                                .slice(0, 8)
                                .toUpperCase()}

                              {" • "}

                              Created{" "}
                              {formatDate(
                                rfq.created_at
                              )}

                            </p>

                            <p
                              className={`mt-3 line-clamp-2 ${
                                unreadCount > 0
                                  ? "font-semibold text-aviation-dark"
                                  : "text-aviation-muted"
                              }`}
                            >
                              {preview}
                            </p>

                          </div>

                        </div>

                        {/* RIGHT */}

                        <div className="flex shrink-0 items-center gap-4">

                          {latestMessage && (

                            <div className="text-right">

                              <p className="text-xs text-aviation-muted">
                                Last message
                              </p>

                              <p className="mt-1 text-sm text-aviation-muted">
                                {new Date(
                                  latestMessage.created_at
                                ).toLocaleString(
                                  "en-GB"
                                )}
                              </p>

                            </div>

                          )}

                          <ArrowRight
                            size={20}
                            className="text-aviation-muted transition group-hover:translate-x-1 group-hover:text-aviation-primary"
                          />

                        </div>

                      </div>

                    </div>

                  </Link>
                );
              }
            )}

          </section>

        )}

      </div>

    </main>
  );
}
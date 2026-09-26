import { supabase } from "@/lib/supabase";

export interface Message {
  id: string;
  rfq_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;

  sender?: {
    id: string;
    full_name?: string | null;
    company_name?: string | null;
  };

  recipient?: {
    id: string;
    full_name?: string | null;
    company_name?: string | null;
  };

  rfq?: {
    id: string;
    part_number?: string | null;
    description?: string | null;
    status?: string | null;
  };
}

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function hydrateMessages(
  rows: Array<{
    id: string;
    rfq_id: string;
    sender_id: string;
    recipient_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }>
): Promise<Message[]> {
  const userIds = [
    ...new Set(
      rows.flatMap((row) => [
        row.sender_id,
        row.recipient_id,
      ])
    ),
  ];

  const rfqIds = [
    ...new Set(rows.map((row) => row.rfq_id)),
  ];

  const [profilesResult, rfqsResult] =
    await Promise.all([
      userIds.length
        ? supabase
            .from("profiles")
            .select("id, full_name, company_name")
            .in("id", userIds)
        : Promise.resolve({
            data: [],
            error: null,
          }),

      rfqIds.length
        ? supabase
            .from("rfqs")
            .select(
              "id, part_id, message, status"
            )
            .in("id", rfqIds)
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map(
      (profile) => [profile.id, profile]
    )
  );

  const rfqRows = rfqsResult.data ?? [];

  const partIds = [
    ...new Set(
      rfqRows
        .map((rfq) => rfq.part_id)
        .filter(
          (id): id is string => Boolean(id)
        )
    ),
  ];

  const { data: parts } = partIds.length
    ? await supabase
        .from("parts")
        .select("id, part_number, description")
        .in("id", partIds)
    : { data: [] };

  const partMap = new Map(
    (parts ?? []).map((part) => [
      part.id,
      part,
    ])
  );

  const rfqMap = new Map(
    rfqRows.map((rfq) => {
      const part = rfq.part_id
        ? partMap.get(rfq.part_id)
        : undefined;

      return [
        rfq.id,
        {
          id: rfq.id,
          part_number: part?.part_number ?? null,
          description:
            part?.description ??
            rfq.message ??
            null,
          status: rfq.status,
        },
      ];
    })
  );

  return rows.map((row) => ({
    ...row,
    sender: profileMap.get(row.sender_id),
    recipient: profileMap.get(row.recipient_id),
    rfq: rfqMap.get(row.rfq_id),
  }));
}

export async function getMyMessages(): Promise<Message[]> {
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, rfq_id, sender_id, recipient_id, message, is_read, created_at"
    )
    .or(
      `sender_id.eq.${user.id},recipient_id.eq.${user.id}`
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("GET MY MESSAGES ERROR:", error);
    return [];
  }

  return hydrateMessages(data ?? []);
}

export async function getRFQMessages(
  rfqId: string
): Promise<Message[]> {
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, rfq_id, sender_id, recipient_id, message, is_read, created_at"
    )
    .eq("rfq_id", rfqId)
    .or(
      `sender_id.eq.${user.id},recipient_id.eq.${user.id}`
    )
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("GET RFQ MESSAGES ERROR:", error);
    return [];
  }

  return hydrateMessages(data ?? []);
}

export async function sendMessage(
  rfqId: string,
  recipientId: string,
  message: string
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated.",
    };
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return {
      success: false,
      error: "Message cannot be empty.",
    };
  }

  if (!recipientId || recipientId === user.id) {
    return {
      success: false,
      error: "A valid recipient is required.",
    };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      rfq_id: rfqId,
      sender_id: user.id,
      recipient_id: recipientId,
      message: trimmedMessage,
      is_read: false,
    })
    .select(
      "id, rfq_id, sender_id, recipient_id, message, is_read, created_at"
    )
    .single();

  if (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
    data,
  };
}

export async function markMessageAsRead(
  messageId: string
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated.",
    };
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("recipient_id", user.id);

  if (error) {
    return {
      success: false,
      error,
    };
  }

  return { success: true };
}

export async function markRFQMessagesAsRead(
  rfqId: string
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated.",
    };
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("rfq_id", rfqId)
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    return {
      success: false,
      error,
    };
  }

  return { success: true };
}

export async function getUnreadMessageCount(): Promise<number> {
  const user = await getCurrentUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error(
      "GET UNREAD MESSAGE COUNT ERROR:",
      error
    );
    return 0;
  }

  return count ?? 0;
}

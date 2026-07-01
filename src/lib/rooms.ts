import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Message, RoomWithPreview } from "@/types/database.types";

/**
 * Lấy danh sách phòng chat của một user, kèm tin nhắn cuối + số thành viên,
 * sắp xếp theo hoạt động gần nhất (phòng có tin mới nhất lên đầu).
 *
 * Dùng vài query đơn giản thay vì 1 câu SQL view phức tạp — phù hợp với quy
 * mô nhỏ của app này (vài chục phòng, vài chục tin nhắn/phòng cũng đủ nhanh).
 */
export async function getRoomsWithPreview(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<RoomWithPreview[]> {
  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id, status")
    .eq("user_id", userId);

  const roomIds = (memberships ?? []).map((m) => m.room_id);
  if (roomIds.length === 0) return [];

  const myStatusByRoom = new Map((memberships ?? []).map((m) => [m.room_id, m.status]));

  const [{ data: rooms }, { data: approvedMembers }, { data: recentMessages }] = await Promise.all([
    supabase.from("rooms").select("*").in("id", roomIds),
    supabase.from("room_members").select("room_id").eq("status", "approved").in("room_id", roomIds),
    supabase
      .from("messages")
      .select("*")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const memberCountByRoom = new Map<string, number>();
  for (const row of approvedMembers ?? []) {
    memberCountByRoom.set(row.room_id, (memberCountByRoom.get(row.room_id) ?? 0) + 1);
  }

  const lastMessageByRoom = new Map<string, Message>();
  for (const message of recentMessages ?? []) {
    if (!lastMessageByRoom.has(message.room_id)) {
      lastMessageByRoom.set(message.room_id, message);
    }
  }

  const result: RoomWithPreview[] = (rooms ?? []).map((room) => ({
    ...room,
    member_count: memberCountByRoom.get(room.id) ?? 1,
    last_message: lastMessageByRoom.get(room.id) ?? null,
    my_status: myStatusByRoom.get(room.id) ?? "pending",
  }));

  result.sort((a, b) => {
    const aTime = a.last_message?.created_at ?? a.created_at;
    const bTime = b.last_message?.created_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return result;
}

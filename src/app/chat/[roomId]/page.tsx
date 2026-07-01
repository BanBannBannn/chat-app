import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/chat-window";
import { PendingApprovalScreen } from "@/components/chat/pending-approval-screen";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: room } = await supabase.from("rooms").select("name").eq("id", roomId).maybeSingle();
  return { title: room ? `${room.name} · Ember Chat` : "Ember Chat" };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=/chat/${roomId}`);
  const user = userData.user;

  // RLS (`rooms_select_related`) chỉ trả về dòng này nếu user hiện tại CÓ
  // quan hệ (pending hoặc approved) với phòng — không liên quan gì thì `room`
  // sẽ là null dù roomId tồn tại hay không.
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (!room) redirect("/chat?roomError=not_member");

  const { data: myMembership } = await supabase
    .from("room_members")
    .select("status")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Trường hợp hiếm: có quyền xem `rooms` (vì RLS) nhưng lại chưa có dòng
  // room_members nào — về lý thuyết không xảy ra với luồng /join bình
  // thường, nhưng phòng hờ vẫn đẩy về /join để tạo yêu cầu tham gia.
  if (!myMembership) redirect(`/join/${roomId}`);

  if (myMembership.status === "pending") {
    return <PendingApprovalScreen room={room} />;
  }

  const [{ data: memberRows }, { data: messages }] = await Promise.all([
    supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId)
      .eq("status", "approved"),
    supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const memberIds = (memberRows ?? []).map((row) => row.user_id);
  const { data: members } = await supabase.from("profiles").select("*").in("id", memberIds);
  
  // Lấy 300 tin nhắn mới nhất, sau đó đảo ngược lại để hiển thị từ trên xuống (cũ -> mới)
  const sortedMessages = (messages ?? []).reverse();

  return (
    <ChatWindow
      currentUserId={user.id}
      room={room}
      initialMembers={members ?? []}
      initialMessages={sortedMessages}
    />
  );
}

import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";
import { getRoomsWithPreview } from "@/lib/rooms";
import { ChatShell } from "@/components/chat/chat-shell";
import { RoomSidebar } from "@/components/chat/room-sidebar";

// Luôn lấy danh sách phòng + tin nhắn cuối mới nhất khi vào khu vực /chat.
export const dynamic = "force-dynamic";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/chat");

  const rooms = await getRoomsWithPreview(supabase, data.user.id);

  return (
    <ChatShell
      currentUserId={data.user.id}
      sidebar={<RoomSidebar currentUserId={data.user.id} rooms={rooms} />}
    >
      {children}
    </ChatShell>
  );
}

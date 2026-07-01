"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Phòng list (sidebar) được render bởi Server Component để đơn giản & luôn
 * đúng (join + sắp xếp bằng SQL). Hook này chỉ làm một việc: lắng nghe các
 * thay đổi liên quan ("có tin nhắn mới ở phòng nào đó", "vừa được thêm vào
 * một phòng mới") rồi gọi router.refresh() để Server Component tự fetch lại.
 *
 * Lưu ý: subscribe KHÔNG filter theo room_id cho "messages" — Supabase
 * Realtime áp dụng đúng RLS select-policy của user hiện tại trước khi gửi
 * event, nên client này chỉ nhận được tin nhắn của các phòng mình là thành
 * viên, không nhận được tin của phòng người khác.
 */
export function useRoomListRealtime(currentUserId: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`room-list:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_members",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_members",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, router]);
}

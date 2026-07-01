"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/store/chat-store";
import type { Message } from "@/types/database.types";

/**
 * Realtime cho MỘT phòng chat cụ thể: tin nhắn mới (Postgres Changes, lọc
 * theo room_id), ai đang online trong phòng (Presence), ai đang gõ (Broadcast).
 */
export function useChatRealtime(currentUserId: string | null, roomId: string | null) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addMessage = useChatStore((s) => s.addMessage);
  const setOnlineIds = useChatStore((s) => s.setOnlineIds);
  const setTyping = useChatStore((s) => s.setTyping);

  useEffect(() => {
    if (!currentUserId || !roomId) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresInsertPayload<Message>) => {
          addMessage(payload.new);
          if (payload.new.sender_id !== currentUserId) {
            setTyping(payload.new.sender_id, false);
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: { userId: string; isTyping: boolean } }) => {
          if (payload.userId === currentUserId) return;
          setTyping(payload.userId, payload.isTyping);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineIds(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
          // Khi kết nối lại sau khi bị rớt mạng/chuyển tab, có thể đã bị lỡ mất
          // một số tin nhắn Realtime. Gọi router.refresh() để Server Component
          // fetch lại dữ liệu mới nhất.
          router.refresh();
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentUserId, roomId, supabase, addMessage, setOnlineIds, setTyping, router]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!currentUserId) return;
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping },
      });
    },
    [currentUserId]
  );

  return { sendTyping };
}

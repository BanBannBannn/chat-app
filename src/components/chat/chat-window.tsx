"use client";

import { useEffect } from "react";

import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { useChatStore } from "@/store/chat-store";
import type { Message, Profile, Room } from "@/types/database.types";

import { RoomHeader } from "@/components/chat/room-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";

interface ChatWindowProps {
  currentUserId: string;
  room: Room;
  initialMembers: Profile[];
  initialMessages: Message[];
}

export function ChatWindow({
  currentUserId,
  room,
  initialMembers,
  initialMessages,
}: ChatWindowProps) {
  const setCurrentUserId = useChatStore((s) => s.setCurrentUserId);
  const setCurrentRoomId = useChatStore((s) => s.setCurrentRoomId);
  const setProfiles = useChatStore((s) => s.setProfiles);
  const setMessages = useChatStore((s) => s.setMessages);
  const upsertProfile = useChatStore((s) => s.upsertProfile);
  const reset = useChatStore((s) => s.reset);

  // Hydrate lại store mỗi khi chuyển phòng (roomId đổi) — tránh lẫn tin nhắn
  // / thành viên của phòng trước đó.
  useEffect(() => {
    reset();
    setCurrentUserId(currentUserId);
    setCurrentRoomId(room.id);
    setProfiles(initialMembers);
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, currentUserId]);

  // Đồng bộ thêm khi danh sách thành viên hoặc tin nhắn server trả về thay đổi
  // (vd. sau khi chủ phòng duyệt 1 yêu cầu và gọi router.refresh(), hoặc khi
  // server trả về tin nhắn mới do Next.js tự động refresh) — không reset toàn bộ
  // store, chỉ merge thêm vào, để không mất tin nhắn/online state đang có.
  useEffect(() => {
    for (const member of initialMembers) upsertProfile(member);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMembers]);

  useEffect(() => {
    // Merge tin nhắn mới từ server vào store (store đã tự kiểm tra trùng lặp id)
    for (const msg of initialMessages) {
      useChatStore.getState().addMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  const { sendTyping } = useChatRealtime(currentUserId, room.id);

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <RoomHeader room={room} currentUserId={currentUserId} />
      <MessageList currentUserId={currentUserId} />
      <MessageInput currentUserId={currentUserId} roomId={room.id} onTyping={sendTyping} />
    </div>
  );
}

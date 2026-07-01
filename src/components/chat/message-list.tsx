"use client";

import { useEffect, useRef } from "react";

import { useChatStore } from "@/store/chat-store";
import { formatDayDivider, getInitials } from "@/lib/utils";
import type { Message } from "@/types/database.types";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/chat/message-bubble";

function groupByDay(messages: Message[]) {
  const groups: { day: string; items: Message[] }[] = [];
  for (const message of messages) {
    const day = formatDayDivider(message.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.items.push(message);
    } else {
      groups.push({ day, items: [message] });
    }
  }
  return groups;
}

export function MessageList({ currentUserId }: { currentUserId: string }) {
  const messages = useChatStore((s) => s.messages);
  const profiles = useChatStore((s) => s.profiles);
  const typingIds = useChatStore((s) => s.typingIds);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typingIds.size]);

  // Nhiều người có thể cùng gõ một lúc trong phòng nhóm — show 1 dòng / người.
  const typingMembers = Object.values(profiles).filter(
    (p) => p.id !== currentUserId && typingIds.has(p.id)
  );

  const groups = groupByDay(messages);
  const isGroup = Object.keys(profiles).length > 2;

  return (
    <ScrollArea className="scroll-warm flex-1">
      <div className="mx-auto flex max-w-2xl flex-col gap-1 px-4 py-6 sm:px-6">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
            <div className="text-5xl">🍑💬</div>
            <p className="font-display text-lg font-semibold text-foreground">
              Chưa có tin nhắn nào cả
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Gửi lời chào, một emoji, hoặc một sticker để bắt đầu cuộc trò chuyện này.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-1">
            <div className="my-3 flex items-center justify-center">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {group.day}
              </span>
            </div>

            {group.items.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const prev = group.items[index - 1];
              const isFirstInRun = !prev || prev.sender_id !== message.sender_id;
              const senderProfile = profiles[message.sender_id];

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={!isOwn && isFirstInRun}
                  showName={!isOwn && isFirstInRun && isGroup}
                  senderProfile={senderProfile}
                />
              );
            })}
          </div>
        ))}

        {typingMembers.map((member) => (
          <div key={member.id} className="mt-1 flex items-end gap-2 animate-message-in">
            <Avatar className="size-7">
              <AvatarImage src={member.avatar_url ?? undefined} alt={member.username} />
              <AvatarFallback className="text-[10px]">
                {getInitials(member.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-bubble-other-border bg-bubble-other px-3.5 py-3">
              <span className="typing-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="typing-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="typing-dot size-1.5 rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

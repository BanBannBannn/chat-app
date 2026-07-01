"use client";

import { useState } from "react";
import Image from "next/image";

import { cn, formatMessageTime, getInitials } from "@/lib/utils";
import { getStickerById } from "@/lib/stickers";
import type { Message, Profile } from "@/types/database.types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showName?: boolean;
  senderProfile?: Profile;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showName,
  senderProfile,
}: MessageBubbleProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-message-in",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && (
        <div className="size-7 shrink-0">
          {showAvatar && (
            <Avatar className="size-7">
              <AvatarImage
                src={senderProfile?.avatar_url ?? undefined}
                alt={senderProfile?.username}
              />
              <AvatarFallback className="text-[10px]">
                {getInitials(senderProfile?.username)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn("flex max-w-[78%] flex-col gap-1 sm:max-w-[65%]", isOwn && "items-end")}>
        {showName && (
          <span className="px-1 text-[11px] font-medium text-muted-foreground">
            {senderProfile?.username ?? "Ẩn danh"}
          </span>
        )}

        {message.type === "text" && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm",
              isOwn
                ? "rounded-br-md bg-gradient-to-br from-bubble-own-from to-bubble-own-to text-bubble-own-foreground"
                : "rounded-bl-md border border-bubble-other-border bg-bubble-other text-bubble-other-foreground"
            )}
          >
            {message.content}
          </div>
        )}

        {message.type === "sticker" && (
          <div className="sticker-tile size-24">
            <Image
              src={getStickerById(message.sticker_id ?? "")?.src ?? ""}
              alt={getStickerById(message.sticker_id ?? "")?.label ?? "sticker"}
              width={96}
              height={96}
              className="size-full object-contain drop-shadow-sm"
              unoptimized
            />
          </div>
        )}

        {message.type === "image" && message.image_url && (
          <>
            <button
              type="button"
              onClick={() => setIsImageOpen(true)}
              className={cn(
                "block max-w-full overflow-hidden rounded-2xl border shadow-sm",
                isOwn ? "rounded-br-md border-transparent" : "rounded-bl-md border-bubble-other-border"
              )}
            >
              <Image
                src={message.image_url}
                alt="Ảnh đã gửi"
                width={320}
                height={320}
                className="max-h-72 w-auto object-cover"
                unoptimized
              />
            </button>

            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
              <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                <DialogTitle className="sr-only">Xem ảnh đầy đủ</DialogTitle>
                <Image
                  src={message.image_url}
                  alt="Ảnh đã gửi (kích thước đầy đủ)"
                  width={1200}
                  height={1200}
                  className="max-h-[85vh] w-full rounded-2xl object-contain"
                  unoptimized
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        <span className="px-1 text-[11px] text-muted-foreground">
          {formatMessageTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

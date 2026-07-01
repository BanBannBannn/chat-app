import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Message } from "@/types/database.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Initials fallback for an avatar, e.g. "Minh Anh" -> "MA" */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Friendly relative-ish time for message groups, e.g. "14:05" or "Hôm qua, 14:05" */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay) return time;
  if (isYesterday) return `Hôm qua, ${time}`;
  return `${date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })}, ${time}`;
}

export function formatDayDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isSameDay) return "Hôm nay";
  if (isYesterday) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Văn bản rút gọn cho preview tin nhắn cuối trong sidebar danh sách phòng. */
export function getMessagePreviewText(message: Message | null, senderName?: string): string {
  if (!message) return "Chưa có tin nhắn nào";
  const prefix = senderName ? `${senderName}: ` : "";
  if (message.type === "text") return `${prefix}${message.content ?? ""}`;
  if (message.type === "image") return `${prefix}📷 Hình ảnh`;
  return `${prefix}😊 Sticker`;
}

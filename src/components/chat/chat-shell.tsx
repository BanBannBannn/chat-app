"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useRoomListRealtime } from "@/hooks/use-room-list-realtime";

interface ChatShellProps {
  currentUserId: string;
  sidebar: ReactNode;
  children: ReactNode;
}

export function ChatShell({ currentUserId, sidebar, children }: ChatShellProps) {
  const pathname = usePathname();
  // "/chat" (đúng route, không có roomId) => đang ở màn danh sách.
  const isListView = pathname === "/chat";

  useRoomListRealtime(currentUserId);

  return (
    <div className="flex h-[100dvh] bg-background">
      <aside
        className={cn(
          "w-full shrink-0 border-r border-border sm:w-80",
          // Trên mobile: ẩn sidebar khi đang xem 1 phòng cụ thể.
          !isListView && "hidden sm:block"
        )}
      >
        {sidebar}
      </aside>

      <div className={cn("flex-1", isListView && "hidden sm:block")}>{children}</div>
    </div>
  );
}

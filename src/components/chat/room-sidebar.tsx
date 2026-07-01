"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun, SmartphoneNfc } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { cn, formatMessageTime, getInitials, getMessagePreviewText } from "@/lib/utils";
import type { RoomWithPreview } from "@/types/database.types";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CreateRoomDialog } from "@/components/chat/create-room-dialog";
import { JoinRoomDialog } from "@/components/chat/join-room-dialog";
import { LockSettingsDialog } from "@/components/chat/lock-settings-dialog";

export function RoomSidebar({
  currentUserId,
  rooms,
}: {
  currentUserId: string;
  rooms: RoomWithPreview[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleLogoutOthers() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'others' });
    toast.success("Đã đăng xuất khỏi các thiết bị khác");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-bubble-own-from to-bubble-own-to text-base">
            🍑
          </div>
          <span className="font-display text-base font-semibold text-foreground">
            Đoạn chat
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          <CreateRoomDialog />
          <JoinRoomDialog />
          <LockSettingsDialog />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Cài đặt khác">
                <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 size-4" /> Sáng
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 size-4" /> Tối
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 size-4" /> Theo hệ thống
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogoutOthers}>
                <SmartphoneNfc className="mr-2 size-4" /> Đăng xuất thiết bị khác
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon-sm" aria-label="Đăng xuất" onClick={handleLogout}>
            <LogOut />
          </Button>
        </div>
      </div>

      <ScrollArea className="scroll-warm flex-1">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <div className="text-4xl">🍑</div>
            <p className="font-display text-sm font-semibold text-foreground">
              Chưa có phòng chat nào
            </p>
            <p className="text-xs text-muted-foreground">
              Bấm nút &quot;+&quot; để tạo phòng mới, hoặc dùng link mời để tham gia.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col p-2">
            {rooms.map((room) => {
              const isActive = pathname === `/chat/${room.id}`;
              const isPending = room.my_status === "pending";
              const isOwnLastMessage = room.last_message?.sender_id === currentUserId;
              const preview = isPending
                ? "Đang chờ chủ phòng duyệt..."
                : getMessagePreviewText(room.last_message, isOwnLastMessage ? "Bạn" : undefined);

              return (
                <li key={room.id}>
                  <Link
                    href={`/chat/${room.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent",
                      isActive && "bg-accent"
                    )}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bubble-own-from to-bubble-own-to text-sm font-semibold text-bubble-own-foreground">
                      {getInitials(room.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {room.name}
                        </span>
                        {room.last_message && !isPending && (
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatMessageTime(room.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "truncate text-xs",
                          isPending ? "italic text-primary" : "text-muted-foreground"
                        )}
                      >
                        {preview}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}

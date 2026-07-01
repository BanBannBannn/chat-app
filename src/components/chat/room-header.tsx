"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, LogOut, Monitor, Moon, MoreVertical, Sun, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/store/chat-store";
import { getInitials } from "@/lib/utils";
import type { Room } from "@/types/database.types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteLinkDialog } from "@/components/chat/invite-link-dialog";
import { PendingRequestsButton } from "@/components/chat/pending-requests-button";

export function RoomHeader({ room, currentUserId }: { room: Room; currentUserId: string }) {
  const router = useRouter();
  const { setTheme } = useTheme();

  const profiles = useChatStore((s) => s.profiles);
  const onlineIds = useChatStore((s) => s.onlineIds);

  const members = Object.values(profiles);
  const onlineCount = members.filter((m) => onlineIds.has(m.id)).length;

  async function handleLeaveRoom() {
    const supabase = createClient();
    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", room.id)
      .eq("user_id", currentUserId);

    if (error) {
      toast.error("Không rời được phòng", { description: error.message });
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/70 px-3 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="sm:hidden" asChild>
          <Link href="/chat" aria-label="Quay lại danh sách phòng">
            <ArrowLeft />
          </Link>
        </Button>

        <div className="flex -space-x-2.5">
          {members.slice(0, 3).map((member) => (
            <Avatar key={member.id} className="size-9 border-2 border-card">
              <AvatarImage src={member.avatar_url ?? undefined} alt={member.username} />
              <AvatarFallback className="text-xs">{getInitials(member.username)}</AvatarFallback>
            </Avatar>
          ))}
          {members.length === 0 && (
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-bubble-own-from to-bubble-own-to text-sm font-semibold text-bubble-own-foreground">
              {getInitials(room.name)}
            </div>
          )}
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-display text-base font-semibold text-foreground">
            {room.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {members.length} thành viên
            {onlineCount > 0 && ` · ${onlineCount} đang hoạt động`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {room.created_by === currentUserId && <PendingRequestsButton roomId={room.id} />}
        <InviteLinkDialog roomId={room.id} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Đổi giao diện">
              <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun /> Sáng
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon /> Tối
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor /> Theo hệ thống
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Tuỳ chọn khác">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleLeaveRoom}>
              <UserMinus /> Rời phòng
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

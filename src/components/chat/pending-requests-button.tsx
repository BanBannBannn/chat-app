"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database.types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PendingRequestsButton({ roomId }: { roomId: string }) {
  const [pending, setPending] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);

  const fetchPending = useCallback(async () => {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId)
      .eq("status", "pending");

    const ids = (rows ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setPending([]);
      return;
    }
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
    setPending(profiles ?? []);
  }, [roomId]);

  useEffect(() => {
    // Fetch dữ liệu ban đầu khi mount, sau đó subscribe để cập nhật tiếp —
    // đây là pattern fetch-on-mount tiêu chuẩn, không phải state suy ra từ
    // props/state khác (trường hợp mà rule này nhằm cảnh báo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPending();

    const supabase = createClient();
    const channel = supabase
      .channel(`pending-requests:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => fetchPending()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchPending]);

  async function handleApprove(userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("room_members")
      .update({ status: "approved" })
      .eq("room_id", roomId)
      .eq("user_id", userId);

    if (error) toast.error("Không duyệt được", { description: error.message });
    else fetchPending();
  }

  async function handleReject(userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userId);

    if (error) toast.error("Không từ chối được", { description: error.message });
    else fetchPending();
  }

  if (pending.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Yêu cầu tham gia" className="relative">
          <UserPlus />
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {pending.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yêu cầu tham gia ({pending.length})</DialogTitle>
          <DialogDescription>
            Chỉ những người được bạn duyệt mới đọc/gửi được tin nhắn trong phòng này.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2 py-2">
          {pending.map((profile) => (
            <li key={profile.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                <AvatarFallback className="text-xs">{getInitials(profile.username)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {profile.username}
              </span>
              <Button size="icon" variant="outline" onClick={() => handleReject(profile.id)}>
                <X />
              </Button>
              <Button size="icon" onClick={() => handleApprove(profile.id)}>
                <Check />
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hourglass, LogOut, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/types/database.types";

import { Button } from "@/components/ui/button";

export function PendingApprovalScreen({ room }: { room: Room }) {
  const router = useRouter();

  // Lắng nghe realtime: nếu chủ phòng duyệt (UPDATE → status='approved') hoặc
  // từ chối (DELETE dòng của mình), tự refresh trang để chuyển màn hình ngay
  // — người dùng không cần tự bấm tải lại.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pending:${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "room_members", filter: `room_id=eq.${room.id}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "room_members", filter: `room_id=eq.${room.id}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, router]);

  async function handleCancelRequest() {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", room.id)
      .eq("user_id", userData.user.id);

    if (error) {
      toast.error("Không huỷ được yêu cầu", { description: error.message });
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
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent">
        <Hourglass className="size-6 text-primary" />
      </div>
      <h1 className="font-display text-lg font-semibold text-foreground">
        Đang chờ duyệt vào &quot;{room.name}&quot;
      </h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Yêu cầu tham gia của bạn đã được gửi. Trang này sẽ tự chuyển vào đoạn
        chat ngay khi chủ phòng duyệt — không cần tải lại.
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={handleCancelRequest}>
          <X /> Huỷ yêu cầu
        </Button>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut /> Đăng xuất
        </Button>
      </div>
    </div>
  );
}

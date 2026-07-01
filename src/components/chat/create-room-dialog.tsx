"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRoomDialog() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset khi đóng dialog để lần mở sau bắt đầu lại từ đầu.
      setName("");
      setInviteLink(null);
      setIsCopied(false);
    }
  }

  async function handleCreate() {
    if (isLoading) return;
    
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ name: trimmed })
      .select()
      .single();
    setIsLoading(false);

    if (error || !data) {
      toast.error("Không tạo được phòng", { description: error?.message });
      return;
    }

    setInviteLink(`${window.location.origin}/join/${data.id}`);
    router.refresh();
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  function handleGoToRoom() {
    if (!inviteLink) return;
    const roomId = inviteLink.split("/join/")[1];
    handleOpenChange(false);
    router.push(`/chat/${roomId}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Tạo đoạn chat mới">
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!inviteLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Tạo đoạn chat mới</DialogTitle>
              <DialogDescription>
                Đặt tên rồi chia sẻ link mời — dùng cho 1-1 hay nhiều người
                đều được. Người nhận link cần được bạn duyệt mới vào được.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5 py-2">
              <Label htmlFor="room-name">Tên đoạn chat</Label>
              <Input
                id="room-name"
                placeholder="VD: Lan, hoặc Team dự án"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button disabled={!name.trim() || isLoading} onClick={handleCreate}>
                {isLoading && <Loader2 className="animate-spin" />}
                Tạo đoạn chat
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Đã tạo &quot;{name.trim()}&quot; 🎉</DialogTitle>
              <DialogDescription>
                Chia sẻ link này cho người bạn muốn chat cùng — nhớ vào icon
                👤 ở góc trên để duyệt khi họ bấm link nhé.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 py-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
                {isCopied ? <Check className="text-online-dot" /> : <Copy />}
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={handleGoToRoom}>Vào đoạn chat</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractRoomId(input: string): string | null {
  const match = input.trim().match(UUID_RE);
  return match ? match[0] : null;
}

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleJoin() {
    const roomId = extractRoomId(value);
    if (!roomId) {
      toast.error("Link/mã không hợp lệ", {
        description: "Dán nguyên link mời (vd: .../join/xxxxxxxx-xxxx-...) bạn nhận được.",
      });
      return;
    }
    setIsLoading(true);
    // Điều hướng "cứng" (không phải soft navigation) vì /join/[roomId] là một
    // Route Handler thực hiện ghi dữ liệu (thêm thành viên) rồi redirect.
    window.location.href = `/join/${roomId}`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Tham gia phòng bằng link mời">
          <Link2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tham gia bằng link mời</DialogTitle>
          <DialogDescription>
            Dán link mời mà bạn nhận được để gửi yêu cầu tham gia — chủ đoạn
            chat duyệt thì bạn mới đọc/gửi tin nhắn được.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-2">
          <Label htmlFor="invite-link">Link mời</Label>
          <Input
            id="invite-link"
            placeholder="https://...../join/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button disabled={!value.trim() || isLoading} onClick={handleJoin}>
            {isLoading && <Loader2 className="animate-spin" />}
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

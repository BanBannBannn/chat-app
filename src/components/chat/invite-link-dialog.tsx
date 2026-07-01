"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function InviteLinkDialog({ roomId }: { roomId: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/join/${roomId}` : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Link mời phòng">
          <Link2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link mời</DialogTitle>
          <DialogDescription>
            Người có link này, sau khi đăng nhập, sẽ gửi yêu cầu tham gia —
            bạn cần duyệt (icon 👤 ở header) thì họ mới đọc/gửi tin nhắn được.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Input readOnly value={inviteLink} className="text-xs" />
          <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
            {isCopied ? <Check className="text-online-dot" /> : <Copy />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

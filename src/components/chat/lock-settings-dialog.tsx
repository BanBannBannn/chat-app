"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import { useLockStore } from "@/store/lock-store";
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

export function LockSettingsDialog() {
  const [open, setOpen] = useState(false);
  const { pin, setPin, timeoutMinutes, setTimeoutMinutes, setLocked } = useLockStore();

  const [inputPin, setInputPin] = useState("");
  const [inputTimeout, setInputTimeout] = useState(timeoutMinutes.toString());

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setInputPin(pin || "");
      setInputTimeout(timeoutMinutes.toString());
    }
  }

  function handleSave() {
    const newPin = inputPin.trim();
    if (newPin && newPin.length !== 4) return; // Chỉ cho phép PIN 4 ký tự

    setPin(newPin || null);
    setTimeoutMinutes(parseInt(inputTimeout, 10));
    setOpen(false);
  }

  function handleLockNow() {
    setLocked(true);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Cài đặt khóa màn hình">
          <Lock className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bảo mật & Quyền riêng tư</DialogTitle>
          <DialogDescription>
            Thiết lập mã PIN 4 số để khóa màn hình khi không sử dụng. Dữ liệu này chỉ lưu trên thiết bị hiện tại.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pin-code">Mã PIN (4 số)</Label>
            <Input
              id="pin-code"
              type="password"
              inputMode="numeric"
              placeholder="Ví dụ: 1234 (để trống để tắt)"
              value={inputPin}
              maxLength={4}
              onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timeout">Thời gian tự động khóa</Label>
            <select
              id="timeout"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={inputTimeout}
              onChange={(e) => setInputTimeout(e.target.value)}
            >
              <option value="1">Sau 1 phút</option>
              <option value="3">Sau 3 phút</option>
              <option value="5">Sau 5 phút</option>
              <option value="10">Sau 10 phút</option>
              <option value="30">Sau 30 phút</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {pin && (
            <Button variant="outline" onClick={handleLockNow} className="sm:mr-auto">
              Khóa ngay
            </Button>
          )}
          <Button disabled={inputPin.length > 0 && inputPin.length !== 4} onClick={handleSave}>
            Lưu cài đặt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

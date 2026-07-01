"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import { useLockStore } from "@/store/lock-store";
import { useAppLock } from "@/hooks/use-app-lock";
import { Button } from "@/components/ui/button";

function LockScreen() {
  const { checkPin } = useLockStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleKeypad(num: string) {
    if (input.length >= 4) return;
    const next = input + num;
    setInput(next);

    if (next.length === 4) {
      const isValid = checkPin(next);
      if (!isValid) {
        setError(true);
        setTimeout(() => {
          setInput("");
          setError(false);
        }, 1000);
      }
    }
  }

  function handleBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-8" />
        </div>
        
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground">Ứng dụng đã bị khóa</h2>
          <p className="text-sm text-muted-foreground mt-1">Nhập mã PIN để tiếp tục</p>
        </div>

        <div className="flex gap-4 my-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`size-4 rounded-full border-2 transition-colors ${
                input.length > i ? "bg-primary border-primary" : "border-muted-foreground/30"
              } ${error ? "bg-destructive border-destructive" : ""}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="size-16 rounded-full text-xl font-medium"
              onClick={() => handleKeypad(num)}
            >
              {num}
            </Button>
          ))}
          <div />
          <Button
            variant="outline"
            className="size-16 rounded-full text-xl font-medium"
            onClick={() => handleKeypad("0")}
          >
            0
          </Button>
          <Button
            variant="ghost"
            className="size-16 rounded-full text-sm font-medium text-muted-foreground"
            onClick={handleBackspace}
            disabled={input.length === 0}
          >
            Xóa
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { isBlurred } = useAppLock(); // Bật hook theo dõi hoạt động
  const { isLocked, pin } = useLockStore();

  return (
    <>
      {/* Tính năng C (Blur Page): nếu không bị khóa nhưng document bị ẩn (chuyển tab), css sẽ lo phần mờ thông qua class hoặc event. */}
      {isLocked && pin && <LockScreen />}
      
      {/* Vẫn render children ở dưới để khi mở khóa xong không bị chớp giật */}
      <div 
        className={`transition-all duration-300 ${
          isLocked 
            ? "pointer-events-none opacity-0" 
            : isBlurred 
              ? "blur-md scale-95 pointer-events-none opacity-50" 
              : ""
        }`}
      >
        {children}
      </div>
    </>
  );
}

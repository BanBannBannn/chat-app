"use client";

import { useEffect, useRef, useState } from "react";
import { useLockStore } from "@/store/lock-store";

export function useAppLock() {
  const { pin, timeoutMinutes, setLocked } = useLockStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    function handleVisibilityChange() {
      // Option C: Mờ màn hình ngay khi chuyển tab (nếu đã cài mã PIN)
      if (document.hidden && pin) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
        handleActivity();
      }
    }

    // Nếu chưa cài mã PIN, không cần chạy timer theo dõi
    if (!pin) return;

    function handleActivity() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setLocked(true);
      }, timeoutMinutes * 60 * 1000);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    handleActivity();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pin, timeoutMinutes, setLocked]);

  return { isBlurred };
}

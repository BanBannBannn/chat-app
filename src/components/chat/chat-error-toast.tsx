"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ChatErrorToast({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    toast.error(title, { description });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

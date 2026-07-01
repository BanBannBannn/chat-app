"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (next && next.startsWith("/")) callbackUrl.searchParams.set("next", next);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      toast.error("Đăng ký thất bại", { description: error.message });
      setIsLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is enabled on this Supabase project.
      toast.success("Kiểm tra email của bạn", {
        description: "Hãy bấm vào liên kết xác nhận để hoàn tất đăng ký.",
      });
      setIsLoading(false);
      return;
    }

    router.push(next && next.startsWith("/") ? next : "/chat");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Tên hiển thị</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            placeholder="Bí Ngô"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={32}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="ban@vidu.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isLoading} className="mt-2">
        {isLoading && <Loader2 className="animate-spin" />}
        Tạo tài khoản
      </Button>
    </form>
  );
}

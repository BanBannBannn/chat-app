import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập · Ember Chat",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục cuộc trò chuyện."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            href={registerHref}
            className="font-medium text-primary hover:underline"
          >
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}

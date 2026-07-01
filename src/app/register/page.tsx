import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký · Ember Chat",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <AuthShell
      title="Tạo một góc riêng"
      subtitle="Chỉ mất một phút để bắt đầu trò chuyện."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}

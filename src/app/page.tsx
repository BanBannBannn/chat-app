import Link from "next/link";
import {
  Image as ImageIcon,
  Link2,
  MessageCircleHeart,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(data.user);

  return (
    <main className="relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-gradient-to-br from-bubble-own-from to-bubble-own-to opacity-25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-24 size-96 rounded-full bg-secondary opacity-60 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-bubble-own-from to-bubble-own-to text-lg shadow-sm shadow-primary/20">
            🍑
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            Ember Chat
          </span>
        </div>

        {isLoggedIn ? (
          <Button asChild>
            <Link href="/chat">Vào đoạn chat</Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Tạo tài khoản</Link>
            </Button>
          </div>
        )}
      </header>

      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-10 pb-20 text-center sm:pt-16">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles className="size-3.5 text-primary" />
          Riêng tư theo từng đoạn chat — bạn duyệt ai được vào
        </span>

        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Một góc trò chuyện{" "}
          <span className="bg-gradient-to-br from-bubble-own-from to-bubble-own-to bg-clip-text text-transparent">
            riêng tư &amp; ấm áp
          </span>{" "}
          dù chỉ 2 người hay cả nhóm
        </h1>

        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Tạo một đoạn chat, chia sẻ link mời — không cần tìm kiếm hay kết
          bạn rắc rối. Người nhận link chỉ vào được sau khi bạn duyệt, tin
          nhắn cập nhật theo thời gian thực.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isLoggedIn ? (
            <Button size="lg" asChild>
              <Link href="/chat">Vào đoạn chat của tôi</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/register">Bắt đầu miễn phí</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Tôi đã có tài khoản</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20">
        <h2 className="text-center font-display text-2xl font-semibold text-foreground">
          Chỉ 3 bước để bắt đầu
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Tạo phòng chat",
              desc: "Đặt tên cho đoạn chat — dùng cho 1-1 hay cả nhóm đều được.",
            },
            {
              step: "2",
              title: "Chia sẻ link mời",
              desc: "Gửi link cho bất kỳ ai bạn muốn — qua Messenger, Zalo, email...",
            },
            {
              step: "3",
              title: "Bạn duyệt, rồi trò chuyện",
              desc: "Họ bấm link, đăng nhập, gửi yêu cầu — bạn duyệt là vào chat được.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
            >
              <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-bubble-own-from to-bubble-own-to font-display text-sm font-bold text-bubble-own-foreground">
                {item.step}
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Link2,
              title: "Vào bằng link, có duyệt",
              desc: "Gửi link cho ai đó — họ chỉ vào được sau khi bạn đồng ý.",
            },
            {
              icon: Zap,
              title: "Thời gian thực",
              desc: "Tin nhắn, trạng thái online và \"đang nhập...\" cập nhật ngay lập tức.",
            },
            {
              icon: Users,
              title: "2 người hay cả nhóm",
              desc: "Một đoạn chat riêng với 1 người, hoặc một nhóm nhiều người — tuỳ bạn.",
            },
            {
              icon: MessageCircleHeart,
              title: "Sticker & emoji ấm áp",
              desc: "Bộ sticker dễ thương có sẵn, cùng bảng emoji đầy đủ.",
            },
            {
              icon: ImageIcon,
              title: "Gửi ảnh nhanh chóng",
              desc: "Chọn ảnh để gửi, xem ảnh cỡ lớn ngay trong khung chat.",
            },
            {
              icon: Sparkles,
              title: "Giao diện sáng / tối",
              desc: "Tự đổi theo hệ thống của bạn, hoặc chọn tay tuỳ thích.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-4.5" />
              </div>
              <h3 className="font-display text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border py-8 text-center text-sm text-muted-foreground">
        🍑 Ember Chat — một góc riêng nho nhỏ để trò chuyện.
      </footer>
    </main>
  );
}

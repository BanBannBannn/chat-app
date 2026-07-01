import type { Metadata } from "next";
import { ChatErrorToast } from "@/components/chat/chat-error-toast";

export const metadata: Metadata = {
  title: "Đoạn chat · Ember Chat",
};

export default async function ChatIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ joinError?: string; roomError?: string }>;
}) {
  const { joinError, roomError } = await searchParams;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      {joinError && (
        <ChatErrorToast
          title="Không thể tham gia phòng"
          description="Đường link mời không hợp lệ hoặc phòng không còn tồn tại."
        />
      )}
      {roomError && (
        <ChatErrorToast
          title="Không tìm thấy phòng chat"
          description="Phòng này không tồn tại, hoặc bạn chưa phải là thành viên."
        />
      )}
      <div className="text-5xl">🍑💬</div>
      <p className="font-display text-lg font-semibold text-foreground">
        Chọn một đoạn chat để bắt đầu
      </p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Hoặc tạo phòng mới / dùng link mời ở góc trên bên trái.
      </p>
    </div>
  );
}

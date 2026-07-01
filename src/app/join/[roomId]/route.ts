import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Link mời có dạng: https://yourapp.com/join/<roomId>
 *
 * Middleware (`src/proxy.ts`) đảm bảo người dùng PHẢI đăng nhập trước khi tới
 * được route này. Khi tới đây, ta tạo một YÊU CẦU THAM GIA ở trạng thái
 * "pending" (KHÔNG tự động vào phòng) — chủ phòng phải duyệt thì mới đọc/gửi
 * được tin nhắn. Trang `/chat/[roomId]` sẽ tự hiển thị màn "đang chờ duyệt"
 * cho tới khi đó.
 *
 * Dùng `upsert(..., { ignoreDuplicates: true })` (tương đương SQL
 * `ON CONFLICT DO NOTHING`) để bấm lại link nhiều lần không bị lỗi, và quan
 * trọng hơn: không vô tình ghi đè 1 thành viên đã 'approved' trở lại 'pending'.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?next=${encodeURIComponent(`/join/${roomId}`)}`
    );
  }

  const { error } = await supabase.from("room_members").upsert(
    { room_id: roomId, user_id: user.id, status: "pending" },
    { onConflict: "room_id,user_id", ignoreDuplicates: true }
  );

  if (error) {
    // Thường gặp nhất: roomId không tồn tại (lỗi khoá ngoại) hoặc sai định dạng.
    return NextResponse.redirect(`${origin}/chat?joinError=invalid_link`);
  }

  return NextResponse.redirect(`${origin}/chat/${roomId}`);
}

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 đổi tên file convention từ "middleware.ts" thành "proxy.ts"
// (export tên "proxy" thay vì "middleware"). File này chạy trên mọi request
// để refresh session Supabase và chặn truy cập /chat khi chưa đăng nhập.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Áp dụng cho mọi route, TRỪ:
     * - _next/static, _next/image (file nội bộ Next.js)
     * - favicon.ico
     * - các file ảnh tĩnh
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

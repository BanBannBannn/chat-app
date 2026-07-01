# 🍑 Ember Chat

Web chat riêng tư — **2 người hay cả nhóm đều được**. Không cần tìm kiếm hay
kết bạn: tạo một đoạn chat, chia sẻ link mời, và **tự bạn duyệt** ai được vào.
Xây bằng **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui** ở
frontend, và **Supabase (Auth, Database, Realtime, Storage)** ở backend.

## ✨ Tính năng

- **Landing page** công khai giới thiệu app (không cần đăng nhập mới xem được).
- Đăng ký / Đăng nhập bằng Email & Mật khẩu (Supabase Auth).
- **Nhiều đoạn chat, 2 người hoặc cả nhóm** — tạo đoạn chat, lấy **link mời**,
  chia sẻ cho ai bạn muốn.
- **Vào bằng link phải được duyệt** — người bấm link chỉ gửi được *yêu cầu
  tham gia*; họ KHÔNG đọc/gửi được tin nhắn cho tới khi chủ đoạn chat bấm
  duyệt. Lộ link cho người lạ cũng không lộ được nội dung chat.
- Người ngoài cuộc (không phải thành viên đã-được-duyệt) **không thấy được**
  đoạn chat đó tồn tại, tên đoạn chat, danh sách thành viên, hay bất kỳ tin
  nhắn nào — được áp dụng bằng Row Level Security ở tầng database, không thể
  bypass từ phía client.
- **Danh sách đoạn chat** (sidebar kiểu Messenger), preview tin nhắn cuối,
  báo riêng các yêu cầu đang "chờ duyệt".
- Chat realtime, tin nhắn văn bản + emoji, sticker, gửi ảnh (Supabase Storage).
- Trạng thái "đang online", "đang nhập..." theo thời gian thực.
- Dark / Light mode tự động theo hệ thống. Responsive (mobile: 1 màn/lúc;
  desktop: sidebar + khung chat song song).

## 🧱 Stack kỹ thuật

| Phần            | Công nghệ |
|-----------------|-----------|
| Framework       | Next.js 16 (App Router), React 19, TypeScript |
| Styling         | Tailwind CSS v4 + shadcn/ui (Radix UI primitives) |
| State (client)  | Zustand (state của đoạn chat đang mở: tin nhắn, online, đang gõ) |
| Backend         | Supabase (Postgres + Auth + Realtime + Storage) |
| Icons / Toast   | lucide-react / sonner |

---

## 1. Cấu trúc thư mục

```
chat-app/
├── .env.local.example
├── public/stickers/                 # Bộ sticker mặc định (SVG)
├── supabase/
│   ├── reset.sql                     # Dọn schema CŨ (chạy nếu bạn từng setup trước đây)
│   └── schema.sql                    # Schema chính thức (có hệ thống duyệt thành viên)
└── src/
    ├── proxy.ts                       # Next.js 16: thay cho "middleware.ts" cũ
    ├── app/
    │   ├── page.tsx                    # 🌐 Landing page (public)
    │   ├── login/, register/
    │   ├── auth/callback/route.ts
    │   ├── join/[roomId]/route.ts       # 🔗 Link mời → tạo YÊU CẦU tham gia (pending)
    │   └── chat/
    │       ├── layout.tsx                # Auth guard + fetch room list + ChatShell
    │       ├── page.tsx                   # Placeholder "chọn 1 đoạn chat" (desktop)
    │       └── [roomId]/page.tsx          # 1 đoạn chat — tự rẽ pending/approved
    ├── components/chat/
    │   ├── chat-shell.tsx, room-sidebar.tsx
    │   ├── create-room-dialog.tsx, join-room-dialog.tsx, invite-link-dialog.tsx
    │   ├── pending-approval-screen.tsx    # Màn "đang chờ duyệt" (tự chuyển khi được duyệt)
    │   ├── pending-requests-button.tsx    # Nút duyệt/từ chối (chỉ chủ đoạn chat thấy)
    │   ├── chat-window.tsx, room-header.tsx
    │   ├── message-list.tsx, message-bubble.tsx, message-input.tsx
    │   └── emoji-picker.tsx, sticker-picker.tsx
    ├── hooks/
    │   ├── use-chat-realtime.ts          # Realtime cho 1 đoạn chat (lọc theo room_id)
    │   └── use-room-list-realtime.ts     # Tự refresh sidebar khi có hoạt động mới
    ├── lib/{rooms.ts, stickers.ts, utils.ts, supabase/}
    ├── store/chat-store.ts
    └── types/database.types.ts
```

---

## 2. Khởi tạo / chạy project

```bash
npm install
cp .env.local.example .env.local   # rồi điền 2 giá trị Supabase (mục 3)
npm run dev                         # http://localhost:3000
```

Build production: `npm run build && npm run start`.

---

## 3. Setup Supabase

### 3.0. ⚠️ Đã từng chạy schema.sql bản trước (auto-join, không duyệt)?

Vào **SQL Editor → New query**, dán toàn bộ [`supabase/reset.sql`](./supabase/reset.sql)
→ **Run**. Script này dọn sạch bảng/trigger/policy của MỌI bản trước (kể cả
bản 2-người đầu tiên và bản nhiều-phòng-auto-join), **không đụng** Storage
bucket `chat-images`, **không xoá** user trong Authentication.

Nếu đây là lần đầu setup, bỏ qua bước này, chạy thẳng 3.1.

### 3.1. Chạy schema chính thức

**SQL Editor → New query** → dán toàn bộ [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.

Điểm quan trọng trong bản này:

- **`rooms.created_by` lấy trực tiếp từ `auth.uid()` ở server** (cột có
  `default auth.uid()`) — không phụ thuộc giá trị client gửi lên. Đây là chỗ
  sửa cho lỗi *"new row violates row-level security policy for table rooms"*
  khi tạo đoạn chat: trước đây giá trị `created_by` do client tự gửi, nếu vì
  bất kỳ lý do gì (race condition, session lệch...) mà nó không khớp tuyệt
  đối với `auth.uid()` của request, RLS sẽ chặn lại. Giờ giá trị luôn được
  set đúng từ phía database, không thể lệch nữa.
- **`room_members.status`**: `'pending'` (đang chờ duyệt) hoặc `'approved'`
  (đã được duyệt). Bấm link mời chỉ tạo dòng `status='pending'` — **không tự
  vào được phòng**. Người tạo đoạn chat tự động là `'approved'` luôn.
- Hàm `is_room_member()` chỉ tính người **đã approved**; hàm `is_room_owner()`
  dùng để cho phép chủ đoạn chat duyệt/từ chối yêu cầu.

### 3.2. Authentication & URL Configuration

- **Authentication → Providers → Email**: bật/tắt "Confirm email" tuỳ bạn.
- **Authentication → URL Configuration**: Site URL = domain của bạn; Redirect
  URLs thêm `<domain>/auth/callback`.

### 3.3. Giải thích RLS (để hiểu & không bị "access denied")

| Bảng / Bucket       | Hành động | Ai được phép | Vì sao |
|----------------------|-----------|----------------|--------|
| `profiles`           | SELECT    | Mọi user đăng nhập | Cần thấy tên/avatar người khác trong đoạn chat |
| `profiles`           | UPDATE/INSERT | Chỉ chính chủ | Không sửa hồ sơ người khác |
| `rooms`               | SELECT    | Chỉ ai **có quan hệ** với phòng (pending hoặc approved) | Người hoàn toàn ngoài cuộc không thấy tên/tồn tại của phòng |
| `rooms`               | INSERT    | Ai cũng tạo được; `created_by` luôn = `auth.uid()` (server set) | Ai cũng tạo đoạn chat mới |
| `rooms`               | UPDATE/DELETE | Chỉ người tạo | Chỉ chủ đoạn chat đổi tên/xoá |
| `room_members`        | SELECT    | Chính dòng của mình, **hoặc** mọi dòng nếu mình đã `approved` trong phòng đó | Member thấy được ai đang ở/đang xin vào; người pending chỉ thấy đúng dòng của họ |
| `room_members`        | INSERT    | Ai cũng tự thêm được **chính mình**, nhưng **chỉ với `status='pending'`** | Đây là cơ chế "xin vào bằng link" — không ai tự duyệt chính mình được |
| `room_members`        | UPDATE    | **Chỉ chủ đoạn chat** | Chỉ chủ mới đổi `pending → approved` |
| `room_members`        | DELETE    | Chính mình (rời/huỷ yêu cầu), **hoặc** chủ đoạn chat (từ chối/loại) | |
| `messages`             | SELECT/INSERT | Chỉ thành viên **đã approved** | Pending hay người ngoài cuộc tuyệt đối không đọc/gửi được tin nhắn |
| `messages`             | DELETE    | Chỉ chính chủ tin nhắn | Dự phòng tính năng thu hồi |
| Storage `chat-images` | SELECT    | Public | `<img src>` không gửi kèm JWT |
| Storage `chat-images` | INSERT/DELETE | Chỉ trong folder `<uid của mình>/...` | Không ghi đè/xoá ảnh người khác |

**Vì sao an toàn dù "ai cũng tự thêm được mình vào bất kỳ `room_id`"?** Vì
việc đó chỉ tạo ra một dòng **`pending`** — hoàn toàn vô hại, không cho đọc/
gửi được gì cả. Phải được chủ đoạn chat chủ động bấm duyệt (đổi thành
`approved`) thì mới có quyền truy cập thật. Lộ link cho người lạ, nhiều nhất
họ chỉ "biết tên phòng và xin vào" — không đọc được nội dung chat.

---

## 4. Luồng "link mời" hoạt động ra sao

1. Sidebar → "+" → **Tạo đoạn chat mới** → đặt tên → nhận link dạng
   `https://domain/join/<roomId>`.
2. Gửi link cho người bạn muốn mời.
3. Họ bấm link:
   - Chưa đăng nhập → `/login?next=/join/<roomId>` → đăng nhập/đăng ký xong tự
     quay lại link mời.
   - `/join/[roomId]` tạo cho họ một **yêu cầu tham gia** (`status='pending'`)
     rồi đưa họ vào `/chat/<roomId>` — màn hình hiện "**Đang chờ duyệt**" (tự
     động chuyển sang khung chat thật ngay khi được duyệt, không cần tải lại).
4. Bạn (chủ đoạn chat) mở đoạn chat đó → icon 👤 ở header có số đỏ báo có
   người đang xin vào → bấm vào → **Duyệt** ✓ hoặc **Từ chối** ✕ từng người.
5. Sau khi duyệt, người đó đọc/gửi được tin nhắn ngay (không cần họ bấm gì thêm).

---

## 5. Realtime

- **Trong đoạn chat đang mở**: channel `room:<roomId>`, lọc theo đúng
  `room_id` — tin nhắn mới, ai online, ai đang gõ.
- **Sidebar danh sách**: tự refresh khi có tin nhắn mới (ở phòng mình là
  thành viên — RLS tự lọc) hoặc khi trạng thái thành viên của mình đổi.
- **Màn "đang chờ duyệt"**: tự lắng nghe đúng dòng `room_members` của mình,
  chuyển màn ngay khi được duyệt hoặc bị từ chối.
- **Nút duyệt (chủ đoạn chat)**: tự cập nhật danh sách "đang chờ" theo thời
  gian thực khi có người mới bấm link hoặc một yêu cầu được xử lý.

---

## 6. Bug đã sửa

**"Tạo đoạn chat bị lỗi 42501 — new row violates row-level security policy"**
→ Xem giải thích ở mục 3.1: `created_by` giờ do database tự set từ
`auth.uid()`, client không gửi giá trị này lên nữa, nên không còn khả năng
lệch giá trị gây RLS chặn.

**"Gửi 1 câu rồi chữ vẫn còn trong khung, Enter lần 2 mới mất"** → Do bộ gõ
tiếng Việt (IME) dùng Enter đầu tiên để xác nhận ký tự đang soạn, không phải
ý gửi tin của người dùng. Đã sửa bằng cách theo dõi `compositionstart` /
`compositionend` trong `message-input.tsx`, chỉ gửi khi Enter là một lần gõ
thật.

---

## 7. Deploy (Vercel)

```bash
npm install -g vercel
vercel
```

Thêm `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào
Environment Variables của Vercel, và cập nhật Site URL / Redirect URLs trong
Supabase Auth thành domain Vercel thật.

---

## 8. Câu hỏi thường gặp

**Tôi đã từng chạy schema bản trước rồi, giờ sao?**
Chạy `supabase/reset.sql` rồi chạy `supabase/schema.sql` (mục 3.0 → 3.1).
Không cần xoá user trong Authentication.

**Đoạn chat 2 người thì có cần duyệt không?**
Có — quy trình giống nhau cho mọi đoạn chat, dù 2 người hay cả nhóm: bạn tạo,
gửi link, người nhận xin vào, bạn duyệt. Với 2 người thì việc duyệt chỉ mất
1 cú bấm, gần như không khác gì auto-join nhưng an toàn hơn nếu lỡ lộ link.

**Tôi rời/bị loại khỏi đoạn chat, vào lại link mời thì sao?**
Sẽ tạo lại một yêu cầu `pending` mới — chủ đoạn chat duyệt lại từ đầu.

**Đổi/thêm sticker mới?**
Thả file `.svg`/`.png` vào `public/stickers/`, thêm 1 dòng vào mảng
`STICKERS` trong `src/lib/stickers.ts`.

**Lỗi `Invalid API key` / không kết nối được Supabase?**
Kiểm tra lại `.env.local` (đúng Project URL + anon key, không phải
`service_role`) và **restart** `npm run dev` sau khi đổi `.env.local`.

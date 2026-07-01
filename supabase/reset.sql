-- =============================================================================
--  EMBER CHAT — RESET SCRIPT
--  Chạy file này TRƯỚC khi chạy schema.sql, nếu bạn đã từng chạy MỘT TRONG
--  HAI bản schema.sql cũ:
--    - Bản v1: chỉ 2 người, chưa có "rooms".
--    - Bản v2: nhiều phòng nhưng JOIN TỰ DO (chưa cần duyệt).
--  Script này dọn sạch để chạy lại schema.sql (bản v3: có duyệt thành viên).
--
--  ⚠️ XOÁ TOÀN BỘ dữ liệu chat cũ (phòng, tin nhắn, thành viên). KHÔNG xoá
--  user trong Authentication, KHÔNG đụng tới Storage bucket "chat-images".
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_room_created on public.rooms;

drop function if exists public.handle_new_user();
drop function if exists public.handle_new_room();
drop function if exists public.is_room_member(uuid, uuid);
drop function if exists public.is_room_owner(uuid, uuid);

drop table if exists public.messages cascade;
drop table if exists public.room_members cascade;
drop table if exists public.rooms cascade;
drop table if exists public.profiles cascade;

-- Xong phần reset — tiếp theo hãy chạy toàn bộ nội dung file schema.sql.

-- =============================================================================
--  EMBER CHAT — Supabase schema (v3: nhiều phòng + DUYỆT thành viên)
--  Chạy trong Supabase Dashboard → SQL Editor → New query.
--
--  Nếu bạn đã từng chạy MỘT bản schema.sql cũ (v1 hoặc v2), hãy chạy
--  `reset.sql` TRƯỚC, rồi mới chạy file này.
--
--  File này có thể chạy lại nhiều lần một cách an toàn (idempotent).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BẢNG profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Thông tin hiển thị công khai của mỗi user.';

-- -----------------------------------------------------------------------------
-- 2. BẢNG rooms — một đoạn chat (1-1 hoặc nhiều người, tuỳ người tạo).
--    `id` (uuid) chính là mã định danh dùng trong link mời: /join/<id>.
--
--    `created_by` mặc định lấy TRỰC TIẾP từ `auth.uid()` ở phía server —
--    KHÔNG dựa vào giá trị mà client gửi lên. Đây là điểm sửa quan trọng cho
--    lỗi "new row violates row-level security policy for table rooms": dù
--    client gửi sai/thiếu `created_by` thế nào, giá trị thật vẫn luôn đúng là
--    người đang đăng nhập, nên không bao giờ lệch với điều kiện RLS nữa.
-- -----------------------------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table public.rooms is 'Một đoạn chat (1-1 hoặc nhóm). Link mời = /join/<id>.';

-- -----------------------------------------------------------------------------
-- 3. BẢNG room_members — ai đang/đang xin ở trong phòng nào.
--    status:
--      'pending'  = đã bấm link mời, đang CHỜ chủ phòng duyệt.
--      'approved' = đã được duyệt, đọc/gửi tin nhắn được trong phòng.
-- -----------------------------------------------------------------------------
create table if not exists public.room_members (
  room_id    uuid not null references public.rooms (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'approved')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

comment on table public.room_members is 'Quan hệ N-N user-room, kèm trạng thái duyệt thành viên.';

create index if not exists room_members_user_id_idx on public.room_members (user_id);
create index if not exists room_members_room_status_idx on public.room_members (room_id, status);

-- -----------------------------------------------------------------------------
-- 4. BẢNG messages
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  room_id     uuid not null references public.rooms (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('text', 'image', 'sticker')),
  content     text,
  image_url   text,
  sticker_id  text,
  created_at  timestamptz not null default now(),

  constraint messages_payload_matches_type check (
    (type = 'text'    and content    is not null and image_url is null and sticker_id is null) or
    (type = 'image'   and image_url  is not null and sticker_id is null) or
    (type = 'sticker' and sticker_id is not null and image_url is null)
  )
);

comment on table public.messages is 'Tin nhắn (text / image / sticker), gắn với 1 room.';

create index if not exists messages_room_id_created_at_idx on public.messages (room_id, created_at);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

-- -----------------------------------------------------------------------------
-- 5. TRIGGER: tự tạo profile khi có user mới đăng ký.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. TRIGGER: người TẠO phòng tự động là thành viên đầu tiên, status='approved'
--    ngay lập tức (chủ phòng không cần tự duyệt chính mình).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_members (room_id, user_id, status)
  values (new.id, new.created_by, 'approved')
  on conflict (room_id, user_id) do update set status = 'approved';
  return new;
end;
$$;

drop trigger if exists on_room_created on public.rooms;
create trigger on_room_created
  after insert on public.rooms
  for each row execute procedure public.handle_new_room();

-- -----------------------------------------------------------------------------
-- 7. HÀM HỖ TRỢ RLS (SECURITY DEFINER — tránh lỗi "infinite recursion
--    detected in policy" khi một bảng cần tự tham chiếu chính nó trong policy).
-- -----------------------------------------------------------------------------

-- "user X đã được DUYỆT vào room Y chưa?" — dùng cho quyền đọc/gửi tin nhắn.
create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_user_id and status = 'approved'
  );
$$;

-- "user X có phải là CHỦ (người tạo) room Y không?" — dùng để cho phép
-- duyệt/từ chối yêu cầu tham gia, và xoá/đổi tên phòng.
create or replace function public.is_room_owner(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.rooms
    where id = p_room_id and created_by = p_user_id
  );
$$;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.messages     enable row level security;

-- ---- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ---- rooms --------------------------------------------------------------------
-- Thấy được thông tin phòng nếu có BẤT KỲ quan hệ nào với phòng đó (pending
-- HAY approved) — để người đang chờ duyệt vẫn biết mình đang chờ vào phòng
-- tên gì. Người HOÀN TOÀN không liên quan thì không thấy gì cả.
drop policy if exists "rooms_select_member" on public.rooms;
drop policy if exists "rooms_select_related" on public.rooms;
create policy "rooms_select_related"
  on public.rooms for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members
      where room_id = rooms.id and user_id = auth.uid()
    )
  );

drop policy if exists "rooms_insert_own" on public.rooms;
create policy "rooms_insert_own"
  on public.rooms for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "rooms_update_owner" on public.rooms;
create policy "rooms_update_owner"
  on public.rooms for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "rooms_delete_owner" on public.rooms;
create policy "rooms_delete_owner"
  on public.rooms for delete
  to authenticated
  using (created_by = auth.uid());

-- ---- room_members ---------------------------------------------------------
-- Thấy được: chính dòng của mình (để biết trạng thái pending/approved của
-- mình), HOẶC mọi dòng trong phòng mình đã được duyệt (để xem danh sách
-- thành viên + danh sách người đang xin vào nếu mình là chủ phòng).
drop policy if exists "room_members_select_member" on public.room_members;
drop policy if exists "room_members_select" on public.room_members;
create policy "room_members_select"
  on public.room_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_room_member(room_id, auth.uid())
  );

-- "Xin vào phòng" qua link mời: AI cũng tự thêm được CHÍNH MÌNH, nhưng CHỈ
-- với status = 'pending' — không thể tự ý chèn 'approved' cho chính mình.
drop policy if exists "room_members_insert_self" on public.room_members;
drop policy if exists "room_members_insert_self_pending" on public.room_members;
create policy "room_members_insert_self_pending"
  on public.room_members for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- CHỈ chủ phòng được đổi status (duyệt 'pending' → 'approved').
drop policy if exists "room_members_update_owner" on public.room_members;
create policy "room_members_update_owner"
  on public.room_members for update
  to authenticated
  using (public.is_room_owner(room_id, auth.uid()))
  with check (public.is_room_owner(room_id, auth.uid()));

-- Tự rời phòng (xoá dòng của chính mình) HOẶC chủ phòng từ chối/loại thành viên.
drop policy if exists "room_members_delete_self" on public.room_members;
drop policy if exists "room_members_delete_self_or_owner" on public.room_members;
create policy "room_members_delete_self_or_owner"
  on public.room_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_room_owner(room_id, auth.uid())
  );

-- ---- messages ---------------------------------------------------------------
-- Chỉ thành viên ĐÃ ĐƯỢC DUYỆT (status='approved') mới đọc/gửi được tin nhắn
-- — người đang "pending" hay người hoàn toàn ngoài cuộc đều KHÔNG đọc được,
-- dù họ có biết / có link của phòng.
drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (public.is_room_member(room_id, auth.uid()));

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_room_member(room_id, auth.uid())
  );

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 9. REALTIME
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_members'
  ) then
    alter publication supabase_realtime add table public.room_members;
  end if;
end $$;

-- =============================================================================
-- 10. STORAGE — bucket lưu ảnh chat
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

drop policy if exists "chat_images_public_read" on storage.objects;
create policy "chat_images_public_read"
  on storage.objects for select
  using (bucket_id = 'chat-images');

drop policy if exists "chat_images_insert_own_folder" on storage.objects;
create policy "chat_images_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "chat_images_delete_own" on storage.objects;
create policy "chat_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

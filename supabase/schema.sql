-- ─────────────────────────────────────────────────────────────
-- ガンプラ大図鑑 託管バックエンド schema(Phase 2)
-- Supabase SQL Editor に貼って実行する。
-- 設計:従来の kv 同期モデルをそのまま RLS で per-user 隔離する。
--   ・主キー (user_id, key) — 論理キーは従来と同一(mg_zukan_v2 等)
--   ・user_id は auth.uid() が既定値 → client は従来通り {key,value,updated_at} を送るだけ
--   ・RLS: 自分の行しか読めない/書けない
--   ・auth.users への FK on delete cascade → アカウント削除で同期データも消える
--     (App Store 5.1.1(v) アカウント削除要件の土台)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.kv (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.kv enable row level security;

drop policy if exists "kv_select_own" on public.kv;
drop policy if exists "kv_insert_own" on public.kv;
drop policy if exists "kv_update_own" on public.kv;
drop policy if exists "kv_delete_own" on public.kv;

create policy "kv_select_own" on public.kv
  for select using (auth.uid() = user_id);
create policy "kv_insert_own" on public.kv
  for insert with check (auth.uid() = user_id);
create policy "kv_update_own" on public.kv
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kv_delete_own" on public.kv
  for delete using (auth.uid() = user_id);

-- anon(未ログイン)には一切の権限を与えない。authenticated のみ RLS 経由で操作可。
revoke all on public.kv from anon;
grant select, insert, update, delete on public.kv to authenticated;

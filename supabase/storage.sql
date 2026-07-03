-- ─────────────────────────────────────────────────────────
-- P2 第3批(3-3): 画像用 Storage バケット + RLS
-- 実行: Supabase Dashboard → SQL Editor に貼って Run(冪等)
-- 設計: private バケット「images」、パスは {auth.uid()}/{画像id}。
--       各ユーザは自分のフォルダのみ select/insert/update/delete 可。
--       anon には一切の権限を与えない(kv 表と同方針)。
-- ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do nothing;

-- 任意: 1オブジェクト上限(原図は長辺1600px/jpeg想定で通常 <2MB。保守値 10MB)
update storage.buckets set file_size_limit = 10485760 where id = 'images';

drop policy if exists "img_select_own" on storage.objects;
create policy "img_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "img_insert_own" on storage.objects;
create policy "img_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- x-upsert(既存パスへの上書き)には update 権限も要る(再圧縮後の再アップロード等)
drop policy if exists "img_update_own" on storage.objects;
create policy "img_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "img_delete_own" on storage.objects;
create policy "img_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Calendario de publicaciones DANK · esquema para Supabase
-- Pégalo completo en: Supabase > SQL Editor > New query > Run
-- Se puede ejecutar más de una vez sin problema.

-- 1) Calendario (un solo documento con estados, textos, contacto, fechas importantes, etc.)
create table if not exists public.calendar_state (
  id text primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_by_email text
);

-- 2) PDFs de carrusel por publicación (puede haber varias versiones por publicación)
create table if not exists public.post_pdfs (
  id uuid primary key default gen_random_uuid(),
  slot_id text not null,
  path text not null unique,
  filename text not null,
  size bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_by_email text,
  created_at timestamptz not null default now()
);
create index if not exists post_pdfs_slot_idx on public.post_pdfs (slot_id, created_at desc);

-- 3) Seguridad: solo usuarios con sesión iniciada pueden leer y escribir
alter table public.calendar_state enable row level security;
alter table public.post_pdfs enable row level security;

drop policy if exists "calendar_state leer" on public.calendar_state;
drop policy if exists "calendar_state crear" on public.calendar_state;
drop policy if exists "calendar_state editar" on public.calendar_state;
create policy "calendar_state leer" on public.calendar_state for select to authenticated using (true);
create policy "calendar_state crear" on public.calendar_state for insert to authenticated with check (true);
create policy "calendar_state editar" on public.calendar_state for update to authenticated using (true) with check (true);

drop policy if exists "post_pdfs leer" on public.post_pdfs;
drop policy if exists "post_pdfs crear" on public.post_pdfs;
drop policy if exists "post_pdfs borrar" on public.post_pdfs;
create policy "post_pdfs leer" on public.post_pdfs for select to authenticated using (true);
create policy "post_pdfs crear" on public.post_pdfs for insert to authenticated with check (true);
create policy "post_pdfs borrar" on public.post_pdfs for delete to authenticated using (true);

-- 4) Bucket privado para los PDF (solo PDF, máximo 50 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('carruseles', 'carruseles', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 52428800, allowed_mime_types = array['application/pdf'];

drop policy if exists "carruseles leer" on storage.objects;
drop policy if exists "carruseles subir" on storage.objects;
drop policy if exists "carruseles borrar" on storage.objects;
create policy "carruseles leer" on storage.objects for select to authenticated using (bucket_id = 'carruseles');
create policy "carruseles subir" on storage.objects for insert to authenticated with check (bucket_id = 'carruseles');
create policy "carruseles borrar" on storage.objects for delete to authenticated using (bucket_id = 'carruseles');

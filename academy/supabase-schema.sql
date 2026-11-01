-- ============================================================================
-- F.G. ACADEMY — SCHEMA SUPABASE (PostgreSQL + Row Level Security)
-- Esegui questo script nell'SQL Editor del tuo progetto Supabase gratuito.
-- Regola fondamentale: SOLO info@francescagrandi.it ha privilegi di admin.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Funzione helper lato server per verificare se l'utente autenticato è l'Amministratrice
create or replace function public.is_fg_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'info@francescagrandi.it',
    false
  );
$$;

-- 1. PROFILI UTENTE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(trim(first_name)) >= 2),
  last_name text not null check (char_length(trim(last_name)) >= 2),
  bio text default '',
  avatar_url text default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  suspended boolean not null default false,
  marketing_consent boolean not null default false,
  notify_posts boolean not null default true,
  notify_replies boolean not null default true,
  notify_events boolean not null default true,
  notify_resources boolean not null default true,
  notify_admin boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Nessun indirizzo email è esposto nella tabella pubblica profiles
create policy "Utenti autenticati vedono i profili base"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Utente aggiorna solo il proprio profilo (senza cambiare ruolo o approvazione)"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id and not suspended and approval_status = 'approved')
  with check (
    auth.uid() = id
    and (role = 'member' or public.is_fg_admin())
    and (approval_status = 'approved' or public.is_fg_admin())
  );

create policy "Admin gestisce tutti i profili"
  on public.profiles for all
  to authenticated
  using (public.is_fg_admin())
  with check (public.is_fg_admin());

-- 2. IMPOSTAZIONI SITO (Spunto della settimana)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Utenti autenticati leggono impostazioni"
  on public.site_settings for select
  to authenticated
  using (true);

create policy "Solo Admin modifica impostazioni"
  on public.site_settings for all
  to authenticated
  using (public.is_fg_admin())
  with check (public.is_fg_admin());

-- 3. DISCUSSIONI COMMUNITY (SOLO ADMIN PUÒ CREARE/MODIFICARE/ELIMINARE)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Francesca Grandi',
  author_role text not null default 'Mental Coach • Fondatrice',
  title text default '',
  body text not null check (char_length(trim(body)) >= 2),
  image_url text default '',
  pinned boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Iscritti leggono solo discussioni pubblicate (Admin legge anche bozze)"
  on public.posts for select
  to authenticated
  using (status = 'published' or public.is_fg_admin());

create policy "SOLO Admin crea discussioni"
  on public.posts for insert
  to authenticated
  with check (public.is_fg_admin());

create policy "SOLO Admin modifica discussioni"
  on public.posts for update
  to authenticated
  using (public.is_fg_admin())
  with check (public.is_fg_admin());

create policy "SOLO Admin elimina discussioni"
  on public.posts for delete
  to authenticated
  using (public.is_fg_admin());

-- 4. MI PIACE E SALVATAGGI DISCUSSIONI
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Iscritti leggono like ai post"
  on public.post_likes for select to authenticated using (true);

create policy "Iscritti gestiscono il proprio like"
  on public.post_likes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.post_saves (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_saves enable row level security;

create policy "Utente vede e gestisce solo i propri post salvati"
  on public.post_saves for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. COMMENTI E RISPOSTE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Iscritti leggono i commenti"
  on public.comments for select to authenticated using (true);

create policy "Iscritti non sospesi pubblicano commenti"
  on public.comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.suspended = true)
  );

create policy "Autore modifica il proprio commento"
  on public.comments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Autore o Admin elimina commento"
  on public.comments for delete to authenticated
  using (auth.uid() = user_id or public.is_fg_admin());

create table if not exists public.comment_likes (
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

create policy "Iscritti leggono like ai commenti"
  on public.comment_likes for select to authenticated using (true);

create policy "Iscritti gestiscono il proprio like ai commenti"
  on public.comment_likes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. SEGNALAZIONI CONTENUTI
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) >= 3),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Iscritti inviano segnalazioni"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "Solo Admin legge e gestisce le segnalazioni"
  on public.reports for all to authenticated
  using (public.is_fg_admin()) with check (public.is_fg_admin());

-- 7. EVENTI GRATUITI (SOLO ADMIN CREA/MODIFICA)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  event_date date not null,
  event_time text not null,
  image_url text default '',
  join_url text default '',
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Iscritti leggono eventi"
  on public.events for select to authenticated using (true);

create policy "Solo Admin gestisce eventi"
  on public.events for all to authenticated
  using (public.is_fg_admin()) with check (public.is_fg_admin());

-- 8. RISORSE GRATUITE (SOLO ADMIN CREA/MODIFICA)
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  resource_type text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "Iscritti leggono risorse gratuite"
  on public.resources for select to authenticated using (true);

create policy "Solo Admin gestisce risorse"
  on public.resources for all to authenticated
  using (public.is_fg_admin()) with check (public.is_fg_admin());

-- 9. PERCORSI E LEZIONI (PROTEZIONE LATO SERVER PER CONTENUTI PREMIUM)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  cover_url text default '',
  tier text not null default 'premium' check (tier in ('free', 'premium')),
  status text not null default 'coming_soon' check (status in ('available', 'coming_soon')),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Iscritti vedono il catalogo corsi"
  on public.courses for select to authenticated using (true);

create policy "Solo Admin gestisce corsi"
  on public.courses for all to authenticated
  using (public.is_fg_admin()) with check (public.is_fg_admin());

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_title text not null,
  lesson_title text not null,
  content_url text not null,
  tier text not null default 'premium' check (tier in ('free', 'premium')),
  sort_order int not null default 1
);

alter table public.course_lessons enable row level security;

-- Regola lato server: i contenuti delle lezioni premium NON sono accessibili agli utenti gratuiti
create policy "Accesso lezioni: solo corsi gratuiti o Admin"
  on public.course_lessons for select to authenticated
  using (tier = 'free' or public.is_fg_admin());

create policy "Solo Admin gestisce lezioni"
  on public.course_lessons for all to authenticated
  using (public.is_fg_admin()) with check (public.is_fg_admin());

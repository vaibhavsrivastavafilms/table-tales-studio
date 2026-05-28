-- Phase 8: Collaboration scaffold (no realtime yet)

create table if not exists public.project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  share_token text not null unique,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'commenter', 'viewer')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  slide_key text,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'commenter', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_at timestamptz not null default now()
);

create index if not exists project_shares_project_id_idx on public.project_shares(project_id);
create index if not exists project_comments_project_id_idx on public.project_comments(project_id);
create index if not exists project_invites_project_id_idx on public.project_invites(project_id);

alter table public.project_shares enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_invites enable row level security;

-- RLS: project owners only (matches projects ownership pattern)
create policy "Owners manage shares"
  on public.project_shares for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Owners manage comments"
  on public.project_comments for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "Owners manage invites"
  on public.project_invites for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

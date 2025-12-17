create table if not exists public.chat_presence (
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id uuid not null references public.chats (id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, chat_id)
);

create index if not exists chat_presence_user_id_idx on public.chat_presence (user_id);
create index if not exists chat_presence_chat_id_idx on public.chat_presence (chat_id);
create index if not exists chat_presence_last_seen_at_idx on public.chat_presence (last_seen_at);

alter table public.chat_presence enable row level security;

create policy "chat_presence_select_own"
  on public.chat_presence
  for select
  using (auth.uid() = user_id);

create policy "chat_presence_insert_own"
  on public.chat_presence
  for insert
  with check (auth.uid() = user_id);

create policy "chat_presence_update_own"
  on public.chat_presence
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_presence_delete_own"
  on public.chat_presence
  for delete
  using (auth.uid() = user_id);

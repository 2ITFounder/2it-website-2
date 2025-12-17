alter table public.messages
  add column if not exists client_temp_id text;

create index if not exists messages_chat_client_temp_id_idx
  on public.messages (chat_id, client_temp_id);

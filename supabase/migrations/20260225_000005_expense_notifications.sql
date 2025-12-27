-- Expense notifications log

do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_notification_kind') then
    create type public.expense_notification_kind as enum ('due_7d', 'due_1d');
  end if;
end $$;

create table if not exists public.expense_notification_log (
  id uuid primary key default gen_random_uuid(),
  expense_cycle_id uuid not null references public.expense_cycles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  notify_kind public.expense_notification_kind not null,
  sent_at timestamptz not null default now()
);

create unique index if not exists expense_notification_log_unique
  on public.expense_notification_log (expense_cycle_id, user_id, notify_kind);

create index if not exists expense_notification_log_cycle_idx
  on public.expense_notification_log (expense_cycle_id);

create index if not exists expense_notification_log_sent_at_idx
  on public.expense_notification_log (sent_at);

alter table public.expense_notification_log enable row level security;

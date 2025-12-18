-- Expenses module
-- Reuses same RLS pattern as other owner-scoped tables (created_by = auth.uid()).

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_cadence') then
    create type public.expense_cadence as enum ('monthly', 'yearly', 'one_time');
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_split_mode') then
    create type public.expense_split_mode as enum ('equal', 'custom');
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_cycle_status') then
    create type public.expense_cycle_status as enum ('pending', 'paid', 'late');
  end if;
end$$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vendor text,
  category text,
  tags text[] not null default '{}',
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  cadence public.expense_cadence not null,
  first_due_date date not null,
  next_due_date date not null,
  active boolean not null default true,
  split_mode public.expense_split_mode not null default 'equal',
  split_custom jsonb,
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists expenses_created_by_idx on public.expenses (created_by);
create index if not exists expenses_next_due_date_idx on public.expenses (next_due_date);
create index if not exists expenses_active_idx on public.expenses (active);

create table if not exists public.expense_cycles (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  due_date date not null,
  amount numeric(10,2) not null,
  status public.expense_cycle_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists expense_cycles_expense_id_idx on public.expense_cycles (expense_id);
create index if not exists expense_cycles_status_idx on public.expense_cycles (status);
create index if not exists expense_cycles_due_date_idx on public.expense_cycles (due_date);

-- Next due date calculator
create or replace function public.calculate_expense_next_due(p_cadence public.expense_cadence, p_from_date date)
returns date as $$
begin
  if p_from_date is null then
    return null;
  end if;

  case p_cadence
    when 'monthly' then return (p_from_date + interval '1 month')::date;
    when 'yearly' then return (p_from_date + interval '1 year')::date;
    else return null;
  end case;
end;
$$ language plpgsql immutable;

-- Set next_due_date on insert/update
create or replace function public.trg_expenses_set_next_due()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    new.next_due_date := coalesce(
      public.calculate_expense_next_due(new.cadence, new.first_due_date),
      new.first_due_date
    );
  elsif tg_op = 'UPDATE' then
    if new.cadence is distinct from old.cadence
       or new.first_due_date is distinct from old.first_due_date then
      new.next_due_date := coalesce(
        public.calculate_expense_next_due(new.cadence, new.first_due_date),
        new.first_due_date
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_expenses_set_next_due on public.expenses;
create trigger trg_expenses_set_next_due
before insert or update on public.expenses
for each row execute function public.trg_expenses_set_next_due();

-- Auto-create first cycle on insert
create or replace function public.trg_expenses_create_first_cycle()
returns trigger as $$
begin
  insert into public.expense_cycles (expense_id, due_date, amount, status)
  values (new.id, new.first_due_date, new.amount, 'pending');

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_expenses_create_first_cycle on public.expenses;
create trigger trg_expenses_create_first_cycle
after insert on public.expenses
for each row execute function public.trg_expenses_create_first_cycle();

-- Mark a cycle as paid and optionally generate the next one
create or replace function public.pay_expense_cycle(p_cycle_id uuid)
returns table (paid_cycle_id uuid, next_cycle_id uuid, next_due_date date) as $$
declare
  cycle record;
  computed_next date;
begin
  select ec.id,
         ec.expense_id,
         ec.due_date,
         ec.status,
         e.cadence,
         e.amount,
         e.created_by
    into cycle
    from public.expense_cycles ec
    join public.expenses e on e.id = ec.expense_id
   where ec.id = p_cycle_id;

  if not found then
    raise exception 'Expense cycle not found';
  end if;

  if auth.uid() is null or cycle.created_by is distinct from auth.uid() then
    raise exception 'Not authorized';
  end if;

  if cycle.status = 'paid' then
    raise exception 'Cycle already paid';
  end if;

  update public.expense_cycles
     set status = 'paid',
         paid_at = now()
   where id = p_cycle_id;

  computed_next := public.calculate_expense_next_due(cycle.cadence, cycle.due_date);

  if computed_next is not null then
    insert into public.expense_cycles (expense_id, due_date, amount, status)
      values (cycle.expense_id, computed_next, cycle.amount, 'pending')
      returning id into next_cycle_id;

    update public.expenses
       set next_due_date = computed_next
     where id = cycle.expense_id;
  else
    update public.expenses
       set next_due_date = cycle.due_date
     where id = cycle.expense_id;
    next_cycle_id := null;
  end if;

  paid_cycle_id := p_cycle_id;
  next_due_date := coalesce(computed_next, cycle.due_date);
  return;
end;
$$ language plpgsql;

-- RLS
alter table public.expenses enable row level security;
alter table public.expense_cycles enable row level security;

create policy expenses_select_own
  on public.expenses
  for select
  using (auth.uid() = created_by);

create policy expenses_insert_own
  on public.expenses
  for insert
  with check (auth.uid() = created_by);

create policy expenses_update_own
  on public.expenses
  for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy expenses_delete_own
  on public.expenses
  for delete
  using (auth.uid() = created_by);

create policy expense_cycles_select_own
  on public.expense_cycles
  for select
  using (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
    )
  );

create policy expense_cycles_insert_own
  on public.expense_cycles
  for insert
  with check (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
    )
  );

create policy expense_cycles_update_own
  on public.expense_cycles
  for update
  using (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
    )
  );

create policy expense_cycles_delete_own
  on public.expense_cycles
  for delete
  using (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
    )
  );

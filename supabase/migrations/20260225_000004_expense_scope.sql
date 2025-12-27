-- Expenses scope + admin expense users

do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_scope') then
    create type public.expense_scope as enum ('shared', 'personal');
  end if;
end $$;

alter table public.expenses
  add column if not exists expense_scope public.expense_scope not null default 'shared',
  add column if not exists personal_user_id uuid;

create index if not exists expenses_scope_idx on public.expenses (expense_scope);
create index if not exists expenses_personal_user_idx on public.expenses (personal_user_id);

alter table public.admin_users
  add column if not exists include_in_expenses boolean not null default true;

create or replace view public.expense_users as
select
  au.user_id,
  au.include_in_expenses,
  us.username,
  us.email
from public.admin_users au
left join public.user_settings us on us.user_id = au.user_id;

-- RLS: expenses
drop policy if exists expenses_select_own on public.expenses;
drop policy if exists expenses_insert_own on public.expenses;
drop policy if exists expenses_update_own on public.expenses;
drop policy if exists expenses_delete_own on public.expenses;

create policy expenses_select_admin
  on public.expenses
  for select
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy expenses_insert_admin
  on public.expenses
  for insert
  with check (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
    and auth.uid() = created_by
  );

create policy expenses_update_admin
  on public.expenses
  for update
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
    and (expense_scope = 'shared' or personal_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
    and (expense_scope = 'shared' or personal_user_id = auth.uid())
  );

create policy expenses_delete_admin
  on public.expenses
  for delete
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
    and (expense_scope = 'shared' or personal_user_id = auth.uid())
  );

-- RLS: expense_cycles
drop policy if exists expense_cycles_select_own on public.expense_cycles;
drop policy if exists expense_cycles_insert_own on public.expense_cycles;
drop policy if exists expense_cycles_update_own on public.expense_cycles;
drop policy if exists expense_cycles_delete_own on public.expense_cycles;

create policy expense_cycles_select_admin
  on public.expense_cycles
  for select
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy expense_cycles_insert_admin
  on public.expense_cycles
  for insert
  with check (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
        and (e.expense_scope = 'shared' or e.personal_user_id = auth.uid())
    )
  );

create policy expense_cycles_update_admin
  on public.expense_cycles
  for update
  using (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
        and (e.expense_scope = 'shared' or e.personal_user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
        and (e.expense_scope = 'shared' or e.personal_user_id = auth.uid())
    )
  );

create policy expense_cycles_delete_admin
  on public.expense_cycles
  for delete
  using (
    exists (
      select 1
      from public.expenses e
      where e.id = expense_id
        and exists (select 1 from public.admin_users au where au.user_id = auth.uid())
        and (e.expense_scope = 'shared' or e.personal_user_id = auth.uid())
    )
  );

-- Update pay_expense_cycle authorization
drop function if exists public.pay_expense_cycle(uuid);
create function public.pay_expense_cycle(p_cycle_id uuid)
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
         e.expense_scope,
         e.personal_user_id
    into cycle
    from public.expense_cycles ec
    join public.expenses e on e.id = ec.expense_id
   where ec.id = p_cycle_id;

  if not found then
    raise exception 'Expense cycle not found';
  end if;

  if auth.uid() is null
     or not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if not (cycle.expense_scope = 'shared' or cycle.personal_user_id = auth.uid()) then
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
    -- One-time: stop scheduling and mark expense as inactive with no next due date
    update public.expenses
       set next_due_date = null,
           active = false
     where id = cycle.expense_id;
    next_cycle_id := null;
  end if;

  paid_cycle_id := p_cycle_id;
  next_due_date := computed_next;
  return;
end;
$$ language plpgsql;

-- Clean split fields (no longer used)
alter table public.expenses drop column if exists split_mode;
alter table public.expenses drop column if exists split_custom;
drop type if exists public.expense_split_mode;

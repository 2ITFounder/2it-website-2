-- Hardening pay_expense_cycle: one-time handling, precise errors, status check on paid
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
    raise exception 'Already paid';
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

-- Payment automation fields.
alter table public.orders
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_provider text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_payload jsonb;

create unique index if not exists idx_orders_payment_reference
  on public.orders(payment_reference)
  where payment_reference is not null;

create index if not exists idx_orders_paid_at on public.orders(paid_at);
create index if not exists idx_orders_payment_transaction_id on public.orders(payment_transaction_id);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  provider text not null default 'bank_webhook',
  transaction_id text,
  amount numeric not null default 0,
  content text,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;

drop policy if exists "Admins can view payment events" on public.payment_events;
create policy "Admins can view payment events"
on public.payment_events
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create unique index if not exists idx_payment_events_transaction_id
  on public.payment_events(provider, transaction_id)
  where transaction_id is not null;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (length(trim(comment)) between 3 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.product_reviews enable row level security;

drop policy if exists "Anyone can read product reviews" on public.product_reviews;
drop policy if exists "Users can review purchased products" on public.product_reviews;
drop policy if exists "Users can update their own reviews" on public.product_reviews;
drop policy if exists "Users can delete their own reviews" on public.product_reviews;
drop policy if exists "Admins can manage all product reviews" on public.product_reviews;

create policy "Anyone can read product reviews"
on public.product_reviews
for select
using (true);

create policy "Users can review purchased products"
on public.product_reviews
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = auth.uid()
      and o.status = 'paid'
      and oi.product_id = product_reviews.product_id::text
  )
);

create policy "Users can update their own reviews"
on public.product_reviews
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = auth.uid()
      and o.status = 'paid'
      and oi.product_id = product_reviews.product_id::text
  )
);

create policy "Users can delete their own reviews"
on public.product_reviews
for delete
using (auth.uid() = user_id);

create policy "Admins can manage all product reviews"
on public.product_reviews
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists update_product_reviews_updated_at on public.product_reviews;
create trigger update_product_reviews_updated_at
before update on public.product_reviews
for each row
execute function public.update_updated_at_column();

create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);
create index if not exists idx_product_reviews_user_id on public.product_reviews(user_id);

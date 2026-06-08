alter table public.products
add column if not exists pricing_mode text not null default 'paid'
check (pricing_mode in ('paid', 'free', 'contact'));

update public.products
set pricing_mode = case
  when is_free = true then 'free'
  when coalesce(price, 0) <= 0 and coalesce(price_team, 0) <= 0 then 'contact'
  else 'paid'
end
where pricing_mode = 'paid';

create index if not exists idx_products_pricing_mode on public.products(pricing_mode);

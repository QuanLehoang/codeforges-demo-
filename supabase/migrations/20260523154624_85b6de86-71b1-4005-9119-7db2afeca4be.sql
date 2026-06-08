-- 1. Tighten orders INSERT (no more `WITH CHECK (true)`)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Users can create their own or guest orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 2. Tighten order_items INSERT — must belong to an order the caller owns / just created
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Can create items for own order"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NULL AND o.user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
      )
  )
);

-- 3. Storage: drop broad SELECT (listing) policies for public buckets.
--    Files in public buckets remain reachable via the public CDN URL.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC / anon / authenticated.
--    These are only called from RLS policies and the auth trigger, both of which
--    run with elevated privileges and don't need the EXECUTE grant.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.is_account_active(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_account_active(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_account_active(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
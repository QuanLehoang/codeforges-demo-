-- Add image_url and source_url metadata for products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS source_file_path TEXT,
  ADD COLUMN IF NOT EXISTS source_file_name TEXT;

-- Storage bucket for product cover images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for product source code (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-sources', 'product-sources', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for product-images (public read, admin write)
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- RLS policies for product-sources (private; admin upload/delete; signed URLs for download)
CREATE POLICY "Admins can upload product sources"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-sources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product sources"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-sources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product sources"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-sources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all product sources"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-sources' AND public.has_role(auth.uid(), 'admin'));

-- Users can read source files for products they have purchased (paid orders)
CREATE POLICY "Users can read sources of their paid orders"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-sources'
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.products p ON p.id::text = oi.product_id
    WHERE o.user_id = auth.uid()
      AND o.status = 'paid'
      AND p.source_file_path = storage.objects.name
  )
);
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ProductForm,
  emptyProductForm,
  formatMoneyInput,
  formToPayload,
  productSchema,
  type Category,
  type ProductFormState,
} from "./ProductForm";

export type EditableProduct = {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  category: string;
  tags?: string[] | null;
  price: number;
  price_team?: number | null;
  preview: string;
  gradient: string;
  demo_url: string | null;
  source_url: string | null;
  buy_url: string | null;
  is_free?: boolean | null;
  pricing_mode?: "paid" | "free" | "contact" | null;
  image_url?: string | null;
  source_file_path?: string | null;
  source_file_name?: string | null;
};

type Props = {
  product: EditableProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export const EditProductDialog = ({ product, open, onOpenChange, onUpdated }: Props) => {
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title ?? "",
        slug: product.slug ?? "",
        tagline: product.tagline ?? "",
        description: product.description ?? "",
        category: (product.category as Category) ?? "ui-kit",
        tags: (product.tags ?? []).join(", "),
        price: formatMoneyInput(product.price ?? 0),
        priceTeam: formatMoneyInput(product.price_team ?? 0),
        preview: product.preview ?? "✦",
        gradient: product.gradient ?? emptyProductForm.gradient,
        imageUrl: product.image_url ?? "",
        imageFile: null,
        sourceFile: null,
        sourceFileName: product.source_file_name ?? "",
        demoUrl: product.demo_url ?? "",
        buyUrl: product.buy_url ?? "",
        isFree: product.is_free ?? false,
        pricingMode: product.pricing_mode ?? (product.is_free ? "free" : Number(product.price ?? 0) <= 0 && Number(product.price_team ?? 0) <= 0 ? "contact" : "paid"),
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!product) return;
    const parsed = productSchema.safeParse(formToPayload(form));
    if (!parsed.success) {
      toast({ title: "Dữ liệu không hợp lệ", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const tagArray = parsed.data.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10);

    // Upload new image if user picked one
    let imageUrl: string | null | undefined = form.imageUrl || null;
    if (form.imageFile) {
      const ext = form.imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${parsed.data.slug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, form.imageFile, { upsert: true, cacheControl: "3600" });
      if (upErr) {
        setSubmitting(false);
        toast({ title: "Tải ảnh thất bại", description: upErr.message, variant: "destructive" });
        return;
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    // Upload new source file if user picked one
    let sourcePath = product.source_file_path ?? null;
    let sourceName = product.source_file_name ?? null;
    if (form.sourceFile) {
      const safeName = form.sourceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      sourcePath = `${parsed.data.slug}/${Date.now()}-${safeName}`;
      sourceName = form.sourceFile.name;
      const { error: srcErr } = await supabase.storage.from("product-sources").upload(sourcePath, form.sourceFile, { upsert: false });
      if (srcErr) {
        setSubmitting(false);
        toast({ title: "Tải source thất bại", description: srcErr.message, variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase
      .from("products")
      .update({
        slug: parsed.data.slug,
        title: parsed.data.title,
        tagline: parsed.data.tagline,
        description: parsed.data.description,
        category: parsed.data.category,
        tags: tagArray,
        price: parsed.data.price,
        price_team: parsed.data.price_team,
        preview: parsed.data.preview,
        gradient: parsed.data.gradient,
        demo_url: parsed.data.demo_url || null,
        buy_url: parsed.data.buy_url || null,
        is_free: parsed.data.is_free,
        pricing_mode: parsed.data.pricing_mode,
        image_url: imageUrl,
        source_file_path: sourcePath,
        source_file_name: sourceName,
      })
      .eq("id", product.id);
    setSubmitting(false);

    if (error) {
      const msg = error.code === "23505" ? "Slug đã tồn tại, hãy chọn slug khác." : error.message;
      toast({ title: "Cập nhật thất bại", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Đã cập nhật", description: parsed.data.title });
    onOpenChange(false);
    onUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Sửa sản phẩm</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin, giá và liên kết của sản phẩm.
          </DialogDescription>
        </DialogHeader>

        <ProductForm value={form} onChange={setForm} />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-primary">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

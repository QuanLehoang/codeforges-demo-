import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  ProductForm,
  emptyProductForm,
  formToPayload,
  productSchema,
  type ProductFormState,
} from "./ProductForm";

type Props = { onCreated?: () => void };

export const AddProductDialog = ({ onCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);

  const reset = () => setForm(emptyProductForm);

  const handleSubmit = async () => {
    const parsed = productSchema.safeParse(formToPayload(form));
    if (!parsed.success) {
      toast({ title: "Dữ liệu không hợp lệ", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const tagArray = parsed.data.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10);

    // Upload image if provided
    let imageUrl: string | null = null;
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

    // Upload source file if provided
    let sourcePath: string | null = null;
    let sourceName: string | null = null;
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

    const { error } = await supabase.from("products").insert({
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
      source_url: null,
      buy_url: parsed.data.buy_url || null,
      is_free: parsed.data.is_free,
      pricing_mode: parsed.data.pricing_mode,
      image_url: imageUrl,
      source_file_path: sourcePath,
      source_file_name: sourceName,
      created_by: user?.id ?? null,
    });
    setSubmitting(false);

    if (error) {
      const msg = error.code === "23505" ? "Slug đã tồn tại, hãy chọn slug khác." : error.message;
      toast({ title: "Tạo sản phẩm thất bại", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Đã tạo sản phẩm", description: parsed.data.title });
    reset();
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow transition-shadow duration-base">
          <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Thêm sản phẩm mới</DialogTitle>
          <DialogDescription>
            Sản phẩm sẽ hiển thị công khai trên trang danh mục sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <ProductForm value={form} onChange={setForm} autoSlug />

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-primary">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tạo sản phẩm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

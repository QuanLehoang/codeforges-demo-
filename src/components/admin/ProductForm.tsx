import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, X, FileArchive, Loader2 } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CATEGORIES = ["ui-kit", "template", "component", "effect", "saas-starter"] as const;
export type Category = typeof CATEGORIES[number];

export const GRADIENTS = [
  "from-primary/40 via-accent/30 to-secondary/40",
  "from-secondary/40 via-primary/30 to-accent/40",
  "from-accent/40 via-secondary/30 to-primary/40",
  "from-primary/50 via-secondary/30 to-accent/40",
] as const;

export const parseMoneyInput = (value: string) => Number(value.replace(/[^\d]/g, ""));

export const formatMoneyInput = (value: string | number) => {
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
};

export type ProductFormState = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: Category;
  tags: string;
  price: string;
  priceTeam: string;
  preview: string;
  gradient: string;
  imageUrl: string;
  imageFile: File | null;
  sourceFile: File | null;
  sourceFileName: string;
  demoUrl: string;
  buyUrl: string;
  isFree: boolean;
  pricingMode: "paid" | "free" | "contact";
};

export const emptyProductForm: ProductFormState = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  category: "ui-kit",
  tags: "",
  price: "99,000",
  priceTeam: "399,000",
  preview: "✦",
  gradient: GRADIENTS[0],
  imageUrl: "",
  imageFile: null,
  sourceFile: null,
  sourceFileName: "",
  demoUrl: "",
  buyUrl: "",
  isFree: false,
  pricingMode: "paid",
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

type Props = {
  value: ProductFormState;
  onChange: (next: ProductFormState) => void;
  /** When true, slug field auto-syncs from title (used in Add mode). */
  autoSlug?: boolean;
};

export const ProductForm = ({ value, onChange, autoSlug }: Props) => {
  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    onChange({ ...value, [k]: v });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (v: string) => {
    if (autoSlug) {
      onChange({ ...value, title: v, slug: slugify(v) });
    } else {
      set("title", v);
    }
  };

  const handleMoneyChange = (key: "price" | "priceTeam", value: string) => {
    set(key, formatMoneyInput(value));
  };

  const setPricingMode = (pricingMode: ProductFormState["pricingMode"]) => {
    onChange({
      ...value,
      pricingMode,
      isFree: pricingMode === "free",
      price: pricingMode === "paid" ? value.price : "0",
      priceTeam: pricingMode === "paid" ? value.priceTeam : "0",
    });
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh tối đa 5MB");
      return;
    }
    set("imageFile", file);
  };

  const handleSourcePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("File source tối đa 100MB");
      return;
    }
    onChange({ ...value, sourceFile: file, sourceFileName: file.name });
  };

  const imagePreview = value.imageFile
    ? URL.createObjectURL(value.imageFile)
    : value.imageUrl || null;

  const hasExistingImage = !!value.imageUrl && !value.imageFile;
  const hasNewImage = !!value.imageFile;
  const hasExistingSource = !!value.sourceFileName && !value.sourceFile;
  const hasNewSource = !!value.sourceFile;

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Kieu gia *</Label>
        <Select value={value.pricingMode} onValueChange={(v) => setPricingMode(v as ProductFormState["pricingMode"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Tra phi theo gia niem yet</SelectItem>
            <SelectItem value="free">Mien phi - bo qua chuyen khoan</SelectItem>
            <SelectItem value="contact">Contact gia inbox</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-title">Tên sản phẩm *</Label>
          <Input id="p-title" value={value.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Aurora Hero Kit" maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-slug">Slug *</Label>
          <Input
            id="p-slug"
            value={value.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="aurora-hero-kit"
            maxLength={80}
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-tagline">Tagline *</Label>
        <Input id="p-tagline" value={value.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="12 hero sections với hiệu ứng aurora WebGL" maxLength={160} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-desc">Mô tả</Label>
        <Textarea id="p-desc" value={value.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={2000} placeholder="Mô tả chi tiết về sản phẩm..." />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-cat">Danh mục *</Label>
          <Select value={value.category} onValueChange={(v) => set("category", v as Category)}>
            <SelectTrigger id="p-cat"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-tags">Tags (phân cách bằng dấu phẩy)</Label>
          <Input id="p-tags" value={value.tags} onChange={(e) => set("tags", e.target.value)} placeholder="hero, webgl, shader" maxLength={200} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-price">Giá Personal (VND) *</Label>
          <Input
            id="p-price"
            type="text"
            inputMode="numeric"
            value={value.price}
            onChange={(e) => handleMoneyChange("price", e.target.value)}
            placeholder="99,000"
            disabled={value.pricingMode !== "paid"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-price-team">Giá Team (VND) *</Label>
          <Input
            id="p-price-team"
            type="text"
            inputMode="numeric"
            value={value.priceTeam}
            onChange={(e) => handleMoneyChange("priceTeam", e.target.value)}
            placeholder="399,000"
            disabled={value.pricingMode !== "paid"}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
        <div>
          <Label htmlFor="p-free" className="cursor-pointer">Sản phẩm miễn phí</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Khi bật, sản phẩm hiển thị nhãn "Miễn phí" và bỏ qua giá.</p>
        </div>
        <Switch
          id="p-free"
          checked={value.pricingMode === "free"}
          onCheckedChange={(checked) => {
            setPricingMode(checked ? "free" : "paid");
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Ảnh cover sản phẩm</Label>
        <div className="flex items-start gap-4">
          <div className={`h-24 w-40 rounded-lg overflow-hidden border border-border bg-gradient-to-br ${value.gradient} grid place-items-center shrink-0`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-display opacity-70">{value.preview}</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {hasNewImage && (
                <Badge variant="secondary" className="text-xs">Ảnh mới: {value.imageFile?.name}</Badge>
              )}
              {hasExistingImage && (
                <Badge variant="outline" className="text-xs">Đang dùng ảnh đã upload</Badge>
              )}
              {!imagePreview && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Chưa có ảnh</Badge>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImagePick}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> {value.imageUrl || value.imageFile ? "Đổi ảnh" : "Tải ảnh lên"}
              </Button>
              {hasNewImage && !!value.imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { set("imageFile", null); if (imageInputRef.current) imageInputRef.current.value = ""; }}>
                  Huỷ ảnh mới
                </Button>
              )}
              {(value.imageFile || value.imageUrl) && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { onChange({ ...value, imageFile: null, imageUrl: "" }); if (imageInputRef.current) imageInputRef.current.value = ""; }}>
                  <X className="h-4 w-4 mr-1" /> Xoá
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG/PNG/WEBP. Tối đa 5MB. Nếu không upload, sẽ dùng gradient mặc định.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>File source code (.zip)</Label>
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
          <div className="h-10 w-10 rounded bg-muted grid place-items-center">
            <FileArchive className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm font-medium truncate">
                {value.sourceFile?.name || value.sourceFileName || <span className="text-muted-foreground font-normal">Chưa chọn file</span>}
              </div>
              {hasNewSource && (
                <Badge variant="secondary" className="text-xs shrink-0">File mới ({(value.sourceFile!.size / (1024*1024)).toFixed(2)} MB)</Badge>
              )}
              {hasExistingSource && (
                <Badge variant="outline" className="text-xs shrink-0">Đã upload</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">.zip / .rar / .tar.gz · tối đa 100MB. Sẽ giao cho khách sau khi đơn được duyệt.</p>
          </div>
          <input
            ref={sourceInputRef}
            type="file"
            accept=".zip,.rar,.7z,.tar,.gz,application/zip,application/x-rar-compressed,application/x-7z-compressed"
            className="hidden"
            onChange={handleSourcePick}
          />
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => sourceInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> {hasExistingSource || hasNewSource ? "Tải lại" : "Chọn file"}
            </Button>
            {hasNewSource && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { onChange({ ...value, sourceFile: null }); if (sourceInputRef.current) sourceInputRef.current.value = ""; }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-border">
        <div className="text-xs font-mono uppercase tracking-widest text-secondary">Liên kết (tuỳ chọn)</div>
        <div className="space-y-2">
          <Label htmlFor="p-demo">Demo URL</Label>
          <Input id="p-demo" type="url" value={value.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} placeholder="https://demo.example.com" maxLength={500} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-buy">Mua ngoài URL <span className="text-muted-foreground">(Gumroad, Lemon Squeezy...)</span></Label>
          <Input id="p-buy" type="url" value={value.buyUrl} onChange={(e) => set("buyUrl", e.target.value)} placeholder="https://gumroad.com/l/..." maxLength={500} />
        </div>
      </div>
    </div>
  );
};

import { z } from "zod";

export const productSchema = z.object({
  title: z.string().trim().min(2, "Tên tối thiểu 2 ký tự").max(80, "Tối đa 80 ký tự"),
  slug: z.string().trim().min(2, "Slug tối thiểu 2 ký tự").max(80).regex(/^[a-z0-9-]+$/, "Chỉ chữ thường, số, gạch ngang"),
  tagline: z.string().trim().min(5, "Tối thiểu 5 ký tự").max(160, "Tối đa 160 ký tự"),
  description: z.string().trim().max(2000, "Tối đa 2000 ký tự"),
  category: z.enum(CATEGORIES),
  tags: z.string().max(200),
  price: z.number().min(0).max(500000000),
  price_team: z.number().min(0).max(500000000),
  preview: z.string().min(1).max(4),
  gradient: z.string(),
  demo_url: z.string().trim().url("URL demo không hợp lệ").max(500).optional().or(z.literal("")),
  buy_url: z.string().trim().url("URL mua ngoài không hợp lệ").max(500).optional().or(z.literal("")),
  is_free: z.boolean(),
  pricing_mode: z.enum(["paid", "free", "contact"]),
});

export const formToPayload = (v: ProductFormState) => ({
  title: v.title,
  slug: v.slug,
  tagline: v.tagline,
  description: v.description,
  category: v.category,
  tags: v.tags,
  price: v.pricingMode === "paid" ? parseMoneyInput(v.price) : 0,
  price_team: v.pricingMode === "paid" ? parseMoneyInput(v.priceTeam) : 0,
  preview: v.preview,
  gradient: v.gradient,
  demo_url: v.demoUrl,
  buy_url: v.buyUrl,
  is_free: v.pricingMode === "free",
  pricing_mode: v.pricingMode,
});

import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Check, ExternalLink, Gift, Heart, Loader2, MessageCircle, ShoppingCart } from "lucide-react";
import { formatPrice, type CatalogProduct } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

const getPricingMode = (product: CatalogProduct) => {
  if (product.pricing_mode) return product.pricing_mode;
  if (product.is_free) return "free";
  if (Number(product.price) <= 0 && Number(product.price_team) <= 0) return "contact";
  return "paid";
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const [license, setLicense] = useState<"personal" | "team">("personal");
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const isWishlisted = useWishlist((state) => (product ? state.has(product.id) : false));
  const toggleWishlist = useWishlist((state) => state.toggle);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      setProduct((data as unknown as CatalogProduct) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-32 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-display text-3xl mb-4">Không tìm thấy sản phẩm</h1>
        <Link to="/catalog">
          <Button variant="outline">Về danh mục</Button>
        </Link>
      </div>
    );
  }

  const pricingMode = getPricingMode(product);
  const price = license === "team" ? product.price_team : product.price;
  const contactUrl = product.buy_url || "mailto:codeforges.noreply@gmail.com?subject=Contact%20gia%20san%20pham%20CodeForges";

  const handleContact = () => {
    window.open(contactUrl, "_blank", "noopener,noreferrer");
  };

  const handleAdd = () => {
    if (pricingMode === "contact") {
      handleContact();
      return;
    }

    add(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        priceTeam: product.price_team,
        preview: product.preview,
        gradient: product.gradient,
        image_url: product.image_url,
        isFree: pricingMode === "free",
        pricingMode,
      },
      license,
    );
    toast.success("Đã thêm vào giỏ", { description: `${product.title} - ${license}` });
  };

  const handleBuyNow = () => {
    if (pricingMode === "contact") {
      handleContact();
      return;
    }
    handleAdd();
    navigate("/checkout");
  };

  return (
    <div className="container py-8">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh mục
      </Link>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
        <div>
          <div className={`relative aspect-video rounded-2xl border border-border overflow-hidden bg-gradient-to-br ${product.gradient}`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-[180px] font-display drop-shadow-2xl">{product.preview}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-3">Mô tả</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description || "-"}</p>
            </div>
            {product.tags?.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((s) => (
                    <span key={s} className="px-3 py-1 text-xs font-mono rounded-md bg-muted border border-border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="font-display text-2xl font-bold mb-3">Bao gồm</h2>
              <ul className="space-y-2">
                {[
                  "Source code TypeScript đầy đủ",
                  pricingMode === "contact" ? "Báo giá riêng qua inbox" : "Tải xuống sau khi đơn được xác nhận",
                  "Email support 6 tháng",
                  "Update vĩnh viễn",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="rounded-xl border border-border bg-gradient-card p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">{product.category}</span>
              {pricingMode === "free" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 text-success uppercase">
                  <Gift className="h-3 w-3" /> Free
                </span>
              )}
              {pricingMode === "contact" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/10 text-secondary uppercase">
                  <MessageCircle className="h-3 w-3" /> Inbox
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">{product.title}</h1>
            <p className="text-muted-foreground mt-2">{product.tagline}</p>

            {pricingMode === "free" ? (
              <div className="mt-6 p-4 rounded-lg border border-success/40 bg-success/5 text-center">
                <div className="text-2xl font-display font-bold text-success">Miễn phí</div>
                <div className="text-xs text-muted-foreground mt-1">Không cần chuyển khoản</div>
              </div>
            ) : pricingMode === "contact" ? (
                <div className="mt-6 p-4 rounded-lg border border-secondary/40 bg-secondary/5 text-center">
                  <div className="text-2xl font-display font-bold text-secondary">Contact inbox</div>
                <div className="text-xs text-muted-foreground mt-1">Liên hệ để báo giá riêng cho sản phẩm này</div>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setLicense("personal")}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-fast ${
                    license === "personal" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">Personal</div>
                    <div className="text-xs text-muted-foreground">1 developer - 1 dự án</div>
                  </div>
                  <div className="font-mono font-bold">{formatPrice(product.price)}</div>
                </button>
                <button
                  onClick={() => setLicense("team")}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-fast ${
                    license === "team" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      Team <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary uppercase font-mono">Khuyên nghị</span>
                    </div>
                    <div className="text-xs text-muted-foreground">10 developers - không giới hạn dự án</div>
                  </div>
                  <div className="font-mono font-bold">{formatPrice(product.price_team)}</div>
                </button>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Button onClick={handleBuyNow} size="lg" className="w-full bg-gradient-primary hover:shadow-glow transition-shadow duration-base">
                {pricingMode === "free" ? "Nhận miễn phí" : pricingMode === "contact" ? "Contact inbox" : `Mua ngay - ${formatPrice(price)}`}
              </Button>
              {pricingMode === "contact" ? (
                <Button onClick={handleContact} size="lg" variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" /> Liên hệ báo giá
                </Button>
              ) : (
                <Button onClick={handleAdd} size="lg" variant="outline" className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" /> Thêm vào giỏ
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleWishlist(product.id)}
                  className={cn(isWishlisted && "border-primary/50 text-primary")}
                >
                  <Heart className={cn("mr-2 h-4 w-4", isWishlisted && "fill-current")} />
                  {isWishlisted ? "Đã lưu" : "Yêu thích"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!product.demo_url}
                  onClick={() => product.demo_url && window.open(product.demo_url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Demo
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {product.updated_at?.slice(0, 10)}
              </span>
              <span className="font-mono">{product.author_handle}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProductDetail;

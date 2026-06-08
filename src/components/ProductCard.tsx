import { Link } from "react-router-dom";
import { Gift, Heart, MessageCircle } from "lucide-react";
import { formatPrice, type CatalogProduct } from "@/data/products";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

const getPricingMode = (product: CatalogProduct) => {
  if (product.pricing_mode) return product.pricing_mode;
  if (product.is_free) return "free";
  if (Number(product.price) <= 0 && Number(product.price_team) <= 0) return "contact";
  return "paid";
};

export const ProductCard = ({ product }: { product: CatalogProduct }) => {
  const pricingMode = getPricingMode(product);
  const isWishlisted = useWishlist((state) => state.has(product.id));
  const toggleWishlist = useWishlist((state) => state.toggle);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-border bg-gradient-card hover:border-primary/40 transition-all duration-base hover:shadow-glow hover:-translate-y-1"
    >
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${product.gradient} overflow-hidden`}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-7xl font-display text-foreground/90 drop-shadow-lg">{product.preview}</span>
            </div>
          </>
        )}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md glass text-[10px] uppercase tracking-wider font-mono font-semibold">
          {product.category}
        </div>
        {pricingMode === "free" && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-success/90 text-success-foreground text-[10px] uppercase tracking-wider font-mono font-bold flex items-center gap-1">
            <Gift className="h-3 w-3" /> Free
          </div>
        )}
        {pricingMode === "contact" && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-secondary/90 text-secondary-foreground text-[10px] uppercase tracking-wider font-mono font-bold flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> Inbox
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={cn(
            "absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-primary",
            isWishlisted && "border-primary/40 bg-primary/15 text-primary",
          )}
          aria-label={isWishlisted ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold leading-tight group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <span className="font-mono font-bold text-primary shrink-0">
            {pricingMode === "free" ? (
              <span className="text-success">Miễn phí</span>
            ) : pricingMode === "contact" ? (
              <span className="text-secondary">Contact inbox</span>
            ) : (
              formatPrice(product.price)
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{product.tagline}</p>
        <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-muted-foreground">
          <span className="font-mono">{product.author_handle}</span>
        </div>
      </div>
    </Link>
  );
};

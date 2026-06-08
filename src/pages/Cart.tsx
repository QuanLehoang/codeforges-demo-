import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";

const Cart = () => {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center max-w-md">
        <div className="h-20 w-20 rounded-full bg-muted grid place-items-center mx-auto mb-6">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-6">Khám phá danh mục để thêm sản phẩm vào giỏ.</p>
        <Link to="/catalog"><Button>Khám phá ngay</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Giỏ hàng ({items.length})</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.license}`} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-gradient-card">
              <div className={`h-20 w-20 rounded-lg overflow-hidden bg-gradient-to-br ${item.gradient} grid place-items-center shrink-0`}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-display">{item.preview}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground font-mono uppercase mt-1">License: {item.license}</div>
              </div>
              <div className="font-mono font-bold">
                {item.pricingMode === "contact" ? "Contact inbox" : Number(item.price) === 0 ? "Mien phi" : formatPrice(item.price)}
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(item.productId, item.license)} aria-label="Xoá">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-gradient-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Tổng kết đơn</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span><span className="text-gradient font-mono">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Link to="/checkout" className="block mt-6">
              <Button size="lg" className="w-full bg-gradient-primary hover:shadow-glow transition-shadow duration-base">
                Thanh toán <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;

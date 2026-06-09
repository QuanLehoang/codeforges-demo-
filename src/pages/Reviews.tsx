import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, PackageCheck, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type PurchasedProduct = {
  product_id: string;
  title: string;
};

type Review = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  products: {
    title: string;
    slug: string;
  } | null;
};

const sampleReviews = [
  {
    name: "nguyen***@gmail.com",
    product: "Dashboard UI Kit",
    text: "Source sạch, dễ sửa và đúng phong cách dark tech mình cần.",
  },
  {
    name: "devteam***@gmail.com",
    product: "Landing Template",
    text: "Mua xong dùng được ngay, tiết kiệm nhiều thời gian dựng layout.",
  },
  {
    name: "agency***@gmail.com",
    product: "WebGL Effects Pack",
    text: "Hiệu ứng đẹp, có fallback nên không sợ máy yếu bị lag.",
  },
];

const displayDate = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

const Reviews = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canReview = purchasedProducts.length > 0;

  const selectedProduct = useMemo(
    () => purchasedProducts.find((product) => product.product_id === selectedProductId),
    [purchasedProducts, selectedProductId],
  );

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, user_id, product_id, rating, comment, created_at, products(title, slug)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      toast({ title: "Lỗi tải đánh giá", description: error.message, variant: "destructive" });
      return;
    }

    setReviews((data ?? []) as unknown as Review[]);
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      await loadReviews();

      if (user) {
        const { data, error } = await supabase
          .from("orders")
          .select("id, status, order_items(product_id, title)")
          .eq("user_id", user.id)
          .eq("status", "paid");

        if (error) {
          toast({ title: "Lỗi kiểm tra sản phẩm đã mua", description: error.message, variant: "destructive" });
        } else {
          const productMap = new Map<string, PurchasedProduct>();
          (data ?? []).forEach((order) => {
            (order.order_items ?? []).forEach((item) => {
              if (item.product_id && !productMap.has(item.product_id)) {
                productMap.set(item.product_id, { product_id: item.product_id, title: item.title });
              }
            });
          });
          const products = Array.from(productMap.values());
          setPurchasedProducts(products);
          setSelectedProductId(products[0]?.product_id ?? "");
        }
      } else {
        setPurchasedProducts([]);
        setSelectedProductId("");
      }

      setLoading(false);
    };

    if (!authLoading) void loadPage();
  }, [authLoading, user?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedProductId || !selectedProduct) return;

    const cleanComment = comment.trim();
    if (cleanComment.length < 3) {
      toast({ title: "Đánh giá quá ngắn", description: "Vui lòng nhập ít nhất 3 ký tự.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("product_reviews").upsert(
      {
        user_id: user.id,
        product_id: selectedProductId,
        rating,
        comment: cleanComment,
      },
      { onConflict: "user_id,product_id" },
    );
    setSubmitting(false);

    if (error) {
      toast({ title: "Gửi đánh giá thất bại", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Đã gửi đánh giá",
      description: `Đánh giá của bạn đã được gắn với sản phẩm ${selectedProduct.title}.`,
    });
    setComment("");
    setRating(5);
    await loadReviews();
  };

  return (
    <div className="container py-14 md:py-20">
      <div className="max-w-3xl">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Reviews</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Đánh giá khách hàng</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Chỉ tài khoản đã mua sản phẩm và có đơn hàng đã thanh toán mới được gửi đánh giá. Mỗi đánh giá phải liên kết với
          đúng sản phẩm đã mua.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Gửi đánh giá</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Chọn sản phẩm đã mua, chấm sao và viết nhận xét của bạn.
              </p>
            </div>
            <PackageCheck className="h-7 w-7 text-primary" />
          </div>

          {authLoading || loading ? (
            <div className="mt-8 grid place-items-center rounded-lg border border-dashed border-border p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !user ? (
            <div className="mt-8 rounded-lg border border-border bg-background/40 p-6">
              <Lock className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">Bạn cần đăng nhập để đánh giá</h3>
              <p className="mt-2 text-sm text-muted-foreground">Đăng nhập bằng Gmail đã mua hàng để hệ thống kiểm tra đơn paid.</p>
              <Link to="/auth" className="mt-5 inline-block">
                <Button className="bg-gradient-primary">Đăng nhập</Button>
              </Link>
            </div>
          ) : !canReview ? (
            <div className="mt-8 rounded-lg border border-border bg-background/40 p-6">
              <Lock className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">Chưa có sản phẩm đã mua</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tài khoản này chưa có đơn hàng đã thanh toán, nên chưa thể gửi đánh giá. Sau khi mua sản phẩm, form sẽ tự mở.
              </p>
              <Link to="/catalog" className="mt-5 inline-block">
                <Button className="bg-gradient-primary">Xem danh mục</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">Liên kết @ sản phẩm đã mua</label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                >
                  {purchasedProducts.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      @{product.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold">Đánh giá</label>
                  <span className="font-mono text-xs text-muted-foreground">{rating}/5</span>
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="text-primary transition-transform hover:scale-110"
                        aria-label={`Chọn ${value} sao`}
                      >
                        <Star className={`h-7 w-7 ${value <= rating ? "fill-current" : ""}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Nội dung đánh giá</label>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Ví dụ: Source dễ sửa, giao diện đẹp, tải file ổn..."
                  className="min-h-32"
                  maxLength={1000}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Gửi đánh giá cho @{selectedProduct?.title}
              </Button>
            </div>
          )}
        </form>

        <div className="rounded-xl border border-border bg-gradient-card p-6">
          <h2 className="font-display text-2xl font-semibold">Đánh giá mới nhất</h2>
          <div className="mt-6 space-y-4">
            {reviews.length === 0
              ? sampleReviews.map((review) => (
                  <div key={review.name} className="rounded-lg border border-border bg-background/40 p-5">
                    <div className="mb-4 flex gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">"{review.text}"</p>
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="font-semibold">{review.name}</div>
                      <div className="mt-1 font-mono text-xs uppercase text-primary">@{review.product}</div>
                    </div>
                  </div>
                ))
              : reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-border bg-background/40 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex gap-1 text-primary">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : ""}`} />
                        ))}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{displayDate(review.created_at)}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">"{review.comment}"</p>
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="font-semibold">
                        {review.user_id === user?.id ? profile?.display_name ?? "Bạn" : "Khách đã mua"}
                      </div>
                      <div className="mt-1 font-mono text-xs uppercase text-primary">
                        @{review.products?.title ?? "Sản phẩm CodeForges"}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;

import { Star } from "lucide-react";

const reviews = [
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

const Reviews = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Reviews</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Đánh giá khách hàng</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Khu vực này dùng để hiển thị feedback sau khi khách đã mua sản phẩm. Email được che bớt để tránh lộ thông tin người dùng.
      </p>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {reviews.map((review) => (
        <div key={review.name} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="mb-5 flex gap-1 text-primary">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">"{review.text}"</p>
          <div className="mt-6 border-t border-border pt-4">
            <div className="font-semibold">{review.name}</div>
            <div className="mt-1 font-mono text-xs uppercase text-primary">{review.product}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Reviews;

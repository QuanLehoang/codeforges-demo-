import { Gift, Link as LinkIcon, Users } from "lucide-react";

const items = [
  {
    icon: LinkIcon,
    title: "Tạo mã giới thiệu",
    desc: "Mỗi cộng tác viên có một mã riêng để gắn vào đơn hàng.",
  },
  {
    icon: Users,
    title: "Theo dõi người mua",
    desc: "Đơn hàng có mã giới thiệu sẽ được ghi nhận vào dashboard affiliate.",
  },
  {
    icon: Gift,
    title: "Thưởng theo doanh thu",
    desc: "Có thể trả thưởng theo phần trăm hoặc theo từng sản phẩm được bán.",
  },
];

const Affiliate = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Affiliate</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Cộng tác viên CodeForges</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Trang định hướng cho chương trình giới thiệu. Khi cần chạy thật, bạn có thể thêm bảng referral_codes và gắn vào đơn hàng.
      </p>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <item.icon className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">{item.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default Affiliate;

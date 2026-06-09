import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  CreditCard,
  Download,
  Layers,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { type CatalogProduct } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

type HomeStats = {
  components: number;
  templates: number;
  developers: number;
  rating: string;
};

const emptyHomeStats: HomeStats = {
  components: 0,
  templates: 0,
  developers: 0,
  rating: "5.0★",
};

const features = [
  { icon: Sparkles, title: "Hiệu ứng cao cấp", desc: "WebGL shaders, scroll-driven, micro-interactions production-ready." },
  { icon: Zap, title: "Tối ưu performance", desc: "Lazy load, code-split, prefers-reduced-motion fallback sẵn có." },
  { icon: Layers, title: "Design system", desc: "Tokens HSL, dark-first, fully theme-able qua CSS variables." },
  { icon: Code2, title: "TypeScript first", desc: "Strict types, props documented, Storybook stories." },
];

const purchaseSteps = [
  { icon: CreditCard, title: "Tạo đơn", desc: "Nhận nội dung chuyển khoản riêng theo mã 4 số." },
  { icon: CheckCircle2, title: "Xác nhận", desc: "Đơn chỉ tính là thanh toán khi tiền về tài khoản." },
  { icon: Download, title: "Tải source", desc: "File source mở khóa trong trang tài khoản sau khi đã thanh toán." },
  { icon: MessageCircle, title: "Contact inbox", desc: "Sản phẩm cần báo giá sẽ chuyển sang trao đổi qua Discord." },
];

const trustLinks = [
  { icon: BookOpen, title: "Hướng dẫn mua hàng", desc: "Xem rõ từng bước tạo đơn, chuyển khoản và nhận source.", to: "/guide" },
  { icon: ShieldCheck, title: "License rõ ràng", desc: "Quyền dùng Personal/Team và các giới hạn khi bán source.", to: "/license" },
  { icon: Star, title: "Đánh giá khách hàng", desc: "Khu vực feedback sau khi khách đã mua sản phẩm.", to: "/reviews" },
];

const formatCount = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return value.toLocaleString("vi-VN");
};

const Index = () => {
  const [featured, setFeatured] = useState<CatalogProduct[]>([]);
  const [stats, setStats] = useState<HomeStats>(emptyHomeStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [featuredResult, productsCountResult, templatesCountResult, developersCountResult] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .ilike("category", "%template%"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      setFeatured((featuredResult.data ?? []) as unknown as CatalogProduct[]);
      setStats({
        components: productsCountResult.count ?? 0,
        templates: templatesCountResult.count ?? 0,
        developers: developersCountResult.count ?? 0,
        rating: "5.0★",
      });
      setLoading(false);
    })();
  }, []);

  const statItems = [
    { label: "Components", value: `${formatCount(stats.components)}${stats.components > 0 ? "+" : ""}` },
    { label: "Templates", value: formatCount(stats.templates) },
    { label: "Developers", value: formatCount(stats.developers) },
    { label: "Rating", value: stats.rating },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-aurora blur-3xl opacity-40 rounded-full" />
        <div className="container relative py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-mono mb-6 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-glow-pulse" />
            Chủ sở hữu · Lê Hoàng Quân
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Marketplace cho <span className="text-gradient">front-end</span> đẳng cấp
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Component, template và hiệu ứng React production-ready. Mua một lần, dùng vĩnh viễn. Tặng kèm source
            TypeScript + Storybook docs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/catalog">
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-shadow duration-base">
                Khám phá danh mục <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {statItems.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-gradient">
                  {loading ? <Loader2 className="h-7 w-7 animate-spin mx-auto" /> : s.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-border bg-gradient-card hover:border-primary/40 transition-colors duration-base">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-gradient-card p-8">
            <div className="text-xs font-mono text-primary mb-2 uppercase tracking-widest">Quy trình</div>
            <h2 className="font-display text-3xl font-bold">Mua source rõ ràng từ lúc tạo đơn đến lúc tải file</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Website đã có trang hướng dẫn, license, FAQ, trạng thái hệ thống và khu vực review để khách tự kiểm tra trước khi mua.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/guide">
                <Button className="bg-gradient-primary">
                  Xem hướng dẫn <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline">FAQ</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {purchaseSteps.map((step) => (
              <div key={step.title} className="rounded-xl border border-border bg-gradient-card p-5">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {trustLinks.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="rounded-xl border border-border bg-gradient-card p-6 transition-colors hover:border-primary/50"
            >
              <item.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-5 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Mở trang <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-mono text-primary mb-2 uppercase tracking-widest">Nổi bật</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Sản phẩm được yêu thích</h2>
          </div>
          <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : featured.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground">
            Chưa có sản phẩm nào. Truy cập{" "}
            <Link to="/admin" className="text-primary hover:underline">
              trang quản trị
            </Link>{" "}
            để thêm mới.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-aurora opacity-20" />
          <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold max-w-2xl mx-auto">
              Sẵn sàng <span className="text-gradient">build nhanh hơn</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Nhận quyền truy cập toàn bộ thư viện với gói Team. Update vĩnh viễn, license cho 10 dev.
            </p>
            <Link to="/catalog" className="inline-block mt-6">
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-shadow duration-base">
                Bắt đầu ngay
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { type CatalogProduct } from "@/data/products";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  all: "Tất cả",
  "ui-kit": "UI Kits",
  template: "Templates",
  component: "Components",
  effect: "Effects",
  "saas-starter": "SaaS Starters",
};

const Catalog = () => {
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") ?? "all";
  const priceFilter = (params.get("price") ?? "all") as "all" | "free" | "paid";
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"popular" | "newest" | "price-asc" | "price-desc">("popular");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      setProducts((data ?? []) as unknown as CatalogProduct[]);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [
      { id: "all", label: "Tất cả", count: products.length },
      ...Array.from(counts.entries()).map(([id, count]) => ({ id, label: CATEGORY_LABELS[id] ?? id, count })),
    ];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (priceFilter === "free") list = list.filter((p) => (p.pricing_mode ?? (p.is_free ? "free" : p.price <= 0 ? "contact" : "paid")) === "free");
    else if (priceFilter === "paid") list = list.filter((p) => (p.pricing_mode ?? (p.is_free ? "free" : p.price <= 0 ? "contact" : "paid")) === "paid");
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s)));
    }
    switch (sort) {
      case "newest": list.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      default: break;
    }
    return list;
  }, [products, cat, priceFilter, q, sort]);

  const setPriceFilter = (next: "all" | "free" | "paid") => {
    const sp = new URLSearchParams(params);
    if (next === "all") sp.delete("price");
    else sp.set("price", next);
    setParams(sp);
  };

  const priceCounts = useMemo(() => {
    const base = cat === "all" ? products : products.filter((p) => p.category === cat);
    const free = base.filter((p) => (p.pricing_mode ?? (p.is_free ? "free" : p.price <= 0 ? "contact" : "paid")) === "free").length;
    return { all: base.length, free, paid: base.length - free };
  }, [products, cat]);

  return (
    <div className="container py-12">
      <div className="mb-10">
        <div className="text-xs font-mono text-primary mb-2 uppercase tracking-widest">Marketplace</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold">Danh mục sản phẩm</h1>
        <p className="text-muted-foreground mt-2">Khám phá {products.length} sản phẩm trên CodeForge.</p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-6">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Danh mục</h3>
            <div className="space-y-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const sp = new URLSearchParams(params);
                    if (c.id === "all") sp.delete("cat");
                    else sp.set("cat", c.id);
                    setParams(sp);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors duration-fast ${
                    cat === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-xs font-mono opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Giá</h3>
            <div className="space-y-1">
              {([
                { id: "all", label: "Tất cả", count: priceCounts.all },
                { id: "free", label: "Miễn phí", count: priceCounts.free },
                { id: "paid", label: "Trả phí", count: priceCounts.paid },
              ] as const).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriceFilter(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors duration-fast ${
                    priceFilter === p.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-xs font-mono opacity-60">{p.count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc tag..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 px-3 rounded-md bg-input border border-border text-sm"
            >
              <option value="popular">Mặc định</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>

          {loading ? (
            <div className="border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Edit2,
  ExternalLink,
  FileArchive,
  Gift,
  ImageIcon,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProductDialog } from "@/components/admin/AddProductDialog";
import { EditProductDialog, type EditableProduct } from "@/components/admin/EditProductDialog";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { UsersTable } from "@/components/admin/UsersTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DashboardStats = {
  revenue30d: number;
  revenueTrend: string;
  orders30d: number;
  ordersTrend: string;
  customers: number;
  customersTrend: string;
  conversion: number;
  conversionTrend: string;
};

type OrderMetric = {
  created_at: string;
  status: string;
  total: number;
};

type DbProduct = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  price_team: number;
  preview: string;
  gradient: string;
  created_at: string;
  demo_url: string | null;
  source_url: string | null;
  buy_url: string | null;
  is_free: boolean;
  pricing_mode?: "paid" | "free" | "contact" | null;
  image_url: string | null;
  source_file_path: string | null;
  source_file_name: string | null;
};

const emptyDashboardStats: DashboardStats = {
  revenue30d: 0,
  revenueTrend: "+0%",
  orders30d: 0,
  ordersTrend: "+0%",
  customers: 0,
  customersTrend: "+0%",
  conversion: 0,
  conversionTrend: "+0%",
};

const getTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? "+100%" : "+0%";
  const percent = ((current - previous) / previous) * 100;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
};

const sumPaidTotal = (orders: OrderMetric[]) =>
  orders.reduce((sum, order) => sum + (order.status === "paid" ? Number(order.total) : 0), 0);

const Admin = () => {
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "users">("overview");
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(emptyDashboardStats);
  const [weeklyRevenue, setWeeklyRevenue] = useState<number[]>(Array(12).fill(0));
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [productPricing, setProductPricing] = useState("all");

  const overviewStats = useMemo(
    () => [
      {
        label: "Doanh thu (30d)",
        value: formatPrice(dashboardStats.revenue30d),
        icon: DollarSign,
        trend: dashboardStats.revenueTrend,
      },
      {
        label: "Đơn hàng",
        value: dashboardStats.orders30d.toLocaleString("vi-VN"),
        icon: Package,
        trend: dashboardStats.ordersTrend,
      },
      {
        label: "Khách hàng",
        value: dashboardStats.customers.toLocaleString("vi-VN"),
        icon: Users,
        trend: dashboardStats.customersTrend,
      },
      {
        label: "Conversion",
        value: `${dashboardStats.conversion.toFixed(1)}%`,
        icon: TrendingUp,
        trend: dashboardStats.conversionTrend,
      },
    ],
    [dashboardStats],
  );

  const productCategories = useMemo(
    () => Array.from(new Set(dbProducts.map((product) => product.category).filter(Boolean))).sort(),
    [dbProducts],
  );

  const filteredProducts = useMemo(() => {
    const keyword = productQuery.trim().toLowerCase();
    return dbProducts.filter((product) => {
      const pricingMode = product.pricing_mode ?? (product.is_free ? "free" : "paid");
      if (productCategory !== "all" && product.category !== productCategory) return false;
      if (productPricing !== "all" && pricingMode !== productPricing) return false;
      if (!keyword) return true;
      return [product.title, product.slug, product.tagline, product.category, ...(product.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [dbProducts, productCategory, productPricing, productQuery]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Lỗi tải sản phẩm", description: error.message, variant: "destructive" });
      return;
    }
    setDbProducts((data ?? []) as DbProduct[]);
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);

    const now = new Date();
    const current30Start = new Date(now);
    current30Start.setDate(current30Start.getDate() - 30);

    const previous30Start = new Date(now);
    previous30Start.setDate(previous30Start.getDate() - 60);

    const firstWeekStart = new Date(now);
    firstWeekStart.setHours(0, 0, 0, 0);
    firstWeekStart.setDate(firstWeekStart.getDate() - 11 * 7);

    const ordersFrom = firstWeekStart < previous30Start ? firstWeekStart : previous30Start;

    const [
      ordersResult,
      totalCustomersResult,
      currentCustomersResult,
      previousCustomersResult,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("created_at, status, total")
        .gte("created_at", ordersFrom.toISOString()),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", current30Start.toISOString()),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", previous30Start.toISOString())
        .lt("created_at", current30Start.toISOString()),
    ]);

    if (ordersResult.error) {
      toast({ title: "Lỗi tải thống kê đơn hàng", description: ordersResult.error.message, variant: "destructive" });
      setDashboardLoading(false);
      return;
    }

    if (totalCustomersResult.error || currentCustomersResult.error || previousCustomersResult.error) {
      toast({ title: "Lỗi tải thống kê người dùng", variant: "destructive" });
      setDashboardLoading(false);
      return;
    }

    const orders = (ordersResult.data ?? []) as OrderMetric[];
    const currentOrders = orders.filter((order) => new Date(order.created_at) >= current30Start);
    const previousOrders = orders.filter((order) => {
      const createdAt = new Date(order.created_at);
      return createdAt >= previous30Start && createdAt < current30Start;
    });

    const currentRevenue = sumPaidTotal(currentOrders);
    const previousRevenue = sumPaidTotal(previousOrders);
    const currentPaidOrders = currentOrders.filter((order) => order.status === "paid").length;
    const previousPaidOrders = previousOrders.filter((order) => order.status === "paid").length;
    const currentConversion = currentOrders.length > 0 ? (currentPaidOrders / currentOrders.length) * 100 : 0;
    const previousConversion = previousOrders.length > 0 ? (previousPaidOrders / previousOrders.length) * 100 : 0;

    const weekBuckets = Array(12).fill(0) as number[];
    orders.forEach((order) => {
      if (order.status !== "paid") return;
      const createdAt = new Date(order.created_at);
      if (createdAt < firstWeekStart) return;
      const weekIndex = Math.min(
        11,
        Math.max(0, Math.floor((createdAt.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))),
      );
      weekBuckets[weekIndex] += Number(order.total);
    });

    setDashboardStats({
      revenue30d: currentRevenue,
      revenueTrend: getTrend(currentRevenue, previousRevenue),
      orders30d: currentOrders.length,
      ordersTrend: getTrend(currentOrders.length, previousOrders.length),
      customers: totalCustomersResult.count ?? 0,
      customersTrend: getTrend(currentCustomersResult.count ?? 0, previousCustomersResult.count ?? 0),
      conversion: currentConversion,
      conversionTrend: getTrend(currentConversion, previousConversion),
    });
    setWeeklyRevenue(weekBuckets);
    setDashboardLoading(false);
  };

  useEffect(() => {
    loadProducts();
    loadDashboard();
  }, []);

  const handleDelete = async (p: DbProduct) => {
    if (p.source_file_path) {
      await supabase.storage.from("product-sources").remove([p.source_file_path]);
    }
    if (p.image_url) {
      const marker = "/product-images/";
      const idx = p.image_url.indexOf(marker);
      if (idx >= 0) {
        const path = p.image_url.substring(idx + marker.length).split("?")[0];
        await supabase.storage.from("product-images").remove([path]);
      }
    }
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Xóa thất bại", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã xóa vĩnh viễn", description: p.title });
    loadProducts();
  };

  const handleEdit = (p: DbProduct) => {
    setEditing({
      id: p.id,
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      category: p.category,
      tags: p.tags,
      price: Number(p.price),
      price_team: Number(p.price_team),
      preview: p.preview,
      gradient: p.gradient,
      demo_url: p.demo_url,
      source_url: p.source_url,
      buy_url: p.buy_url,
      is_free: p.is_free,
      pricing_mode: p.pricing_mode,
      image_url: p.image_url,
      source_file_path: p.source_file_path,
      source_file_name: p.source_file_name,
    });
    setEditOpen(true);
  };

  const maxWeeklyRevenue = Math.max(...weeklyRevenue, 1);

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono text-secondary uppercase tracking-widest mb-1">Admin Panel</div>
          <h1 className="font-display text-4xl font-bold">Bảng quản trị</h1>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {(["overview", "orders", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "overview" ? "Tổng quan" : t === "orders" ? "Đơn hàng" : "Người dùng"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {overviewStats.map((s) => (
              <div key={s.label} className="p-5 rounded-xl border border-border bg-gradient-card">
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-mono ${s.trend.startsWith("-") ? "text-destructive" : "text-success"}`}>
                    {dashboardLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : s.trend}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="font-display text-2xl font-bold">{dashboardLoading ? "..." : s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-gradient-card p-6">
            <h2 className="font-display text-lg font-bold mb-4">Doanh thu theo tuần</h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {weeklyRevenue.map((value, i) => {
                const height = value > 0 ? Math.max(8, (value / maxWeeklyRevenue) * 100) : 2;
                return (
                  <div
                    key={i}
                    title={formatPrice(value)}
                    className="flex-1 bg-gradient-to-t from-primary/40 to-primary rounded-t transition-all"
                    style={{ height: dashboardLoading ? "12%" : `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "products" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display text-sm font-bold uppercase tracking-widest text-secondary">
                    Sản phẩm trong database ({filteredProducts.length}/{dbProducts.length})
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">Tìm kiếm, lọc danh mục và lọc kiểu giá của sản phẩm.</p>
                </div>
                <Button size="sm" variant="ghost" onClick={loadProducts}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
                </Button>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Tìm theo tên, slug, tag, danh mục..."
                    className="pl-9"
                  />
                </div>
                <select
                  value={productCategory}
                  onChange={(event) => setProductCategory(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Tất cả danh mục</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={productPricing}
                  onChange={(event) => setProductPricing(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Tất cả kiểu giá</option>
                  <option value="paid">Có phí</option>
                  <option value="free">Miễn phí</option>
                  <option value="contact">Liên hệ giá</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : dbProducts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Chưa có sản phẩm nào. Bấm <span className="font-mono text-primary">Thêm sản phẩm</span> để bắt đầu.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">Không có sản phẩm phù hợp với bộ lọc.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left p-4 font-mono">Sản phẩm</th>
                    <th className="text-left p-4 font-mono">Danh mục</th>
                    <th className="text-left p-4 font-mono">Liên kết</th>
                    <th className="text-right p-4 font-mono">Giá</th>
                    <th className="text-right p-4 font-mono">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded overflow-hidden bg-gradient-to-br ${p.gradient} grid place-items-center text-lg`}>
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                            ) : (
                              p.preview
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {p.title}
                              {(p.pricing_mode ?? (p.is_free ? "free" : "paid")) === "free" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30 font-mono uppercase">
                                  <Gift className="h-3 w-3" /> Free
                                </span>
                              ) : (p.pricing_mode ?? "paid") === "contact" ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 font-mono uppercase">
                                  Contact
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-mono uppercase">
                                  Paid
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">{p.category}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {p.demo_url && (
                            <a href={p.demo_url} target="_blank" rel="noopener noreferrer" title="Demo" className="hover:text-primary">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {p.source_file_path && (
                            <span title={p.source_file_name ?? "Source"} className="text-success">
                              <FileArchive className="h-4 w-4" />
                            </span>
                          )}
                          {p.image_url && (
                            <span title="Có ảnh cover" className="text-primary">
                              <ImageIcon className="h-4 w-4" />
                            </span>
                          )}
                          {p.buy_url && (
                            <a href={p.buy_url} target="_blank" rel="noopener noreferrer" title="Mua ngoài" className="hover:text-primary">
                              <ShoppingBag className="h-4 w-4" />
                            </a>
                          )}
                          {!p.demo_url && !p.source_file_path && !p.image_url && !p.buy_url && <span className="text-xs">-</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold">
                        {(p.pricing_mode ?? (p.is_free ? "free" : "paid")) === "free" ? (
                          <span className="text-success">Miễn phí</span>
                        ) : (p.pricing_mode ?? "paid") === "contact" ? (
                          <span className="text-secondary">Liên hệ</span>
                        ) : (
                          formatPrice(Number(p.price))
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(p)} aria-label="Sửa">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" aria-label="Xóa">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này không thể hoàn tác. Sản phẩm{" "}
                                  <span className="font-semibold text-foreground">{p.title}</span> sẽ bị xóa vĩnh viễn khỏi database,
                                  cùng ảnh cover và file source code.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(p)}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "orders" && <OrdersTable />}

      {tab === "users" && <UsersTable />}

      <EditProductDialog product={editing} open={editOpen} onOpenChange={setEditOpen} onUpdated={loadProducts} />
    </div>
  );
};

export default Admin;

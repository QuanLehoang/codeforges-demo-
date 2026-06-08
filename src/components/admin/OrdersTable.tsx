import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/data/products";
import { maskEmail } from "@/lib/privacy";
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

type OrderStatus = "pending" | "paid" | "cancelled";
type StatusFilter = "all" | OrderStatus;
type SortMode = "newest" | "oldest" | "total_desc" | "total_asc";

type OrderItem = {
  id: string;
  title: string;
  license: string;
  price: number;
};

type Order = {
  id: string;
  email: string;
  full_name: string;
  total: number;
  subtotal: number;
  tax: number;
  status: string;
  payment_method: string;
  note: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  paid: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ tiền về",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const getPaymentCode = (note: string | null) => note?.match(/PAYMENT_CODE:(\d{4})/)?.[1] ?? "-";

const getPaymentContent = (note: string | null) => {
  const code = getPaymentCode(note);
  return code === "-" ? "-" : `chuyển khoản đơn hàng số ${code}`;
};

const getCleanNote = (note: string | null) =>
  note
    ?.replace(/^PAYMENT_CODE:\d{4}\s*\|\s*/, "")
    .replace(/^PAYMENT_CODE:\d{4}$/, "")
    .trim() ?? "";

const toCsvValue = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const OrdersTable = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, email, full_name, total, subtotal, tax, status, payment_method, note, created_at, order_items(id, title, license, price)")
      .order("created_at", { ascending: false });
    setLoading(false);

    if (error) {
      toast({ title: "Lỗi tải đơn hàng", description: error.message, variant: "destructive" });
      return;
    }

    setOrders((data ?? []) as unknown as Order[]);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.status === "paid");
    return {
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: paid.length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      revenue: paid.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const list = orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!keyword) return true;

      return [
        order.id,
        order.email,
        order.full_name,
        order.status,
        getPaymentContent(order.note),
        ...(order.order_items ?? []).map((item) => item.title),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    return [...list].sort((a, b) => {
      if (sortMode === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortMode === "total_desc") return Number(b.total) - Number(a.total);
      if (sortMode === "total_asc") return Number(a.total) - Number(b.total);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, query, sortMode, statusFilter]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    setUpdating(null);

    if (error) {
      toast({ title: "Cập nhật thất bại", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Đã cập nhật đơn hàng", description: STATUS_LABEL[status] });
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
  };

  const deleteOrder = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    setDeleting(null);

    if (error) {
      toast({ title: "Xóa đơn hàng thất bại", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Đã xóa đơn hàng" });
    setOrders((prev) => prev.filter((order) => order.id !== id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const copyPaymentContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Đã sao chép nội dung chuyển khoản", description: content });
  };

  const exportCsv = () => {
    const rows = filteredOrders.map((order) => [
      order.id,
      order.full_name,
      order.email,
      STATUS_LABEL[order.status] ?? order.status,
      Number(order.total),
      getPaymentContent(order.note),
      new Date(order.created_at).toLocaleString("vi-VN"),
      (order.order_items ?? []).map((item) => `${item.title} (${item.license})`).join("; "),
    ]);

    const csv = [
      ["id", "khach_hang", "email", "trang_thai", "tong", "noi_dung_ck", "ngay", "san_pham"],
      ...rows,
    ]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codeforges-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-gradient-card p-12 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Tất cả", stats.all],
          ["Chờ tiền", stats.pending],
          ["Đã thanh toán", stats.paid],
          ["Đã hủy", stats.cancelled],
          ["Doanh thu", formatPrice(stats.revenue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-gradient-card p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-display text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-gradient-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-secondary">
                Quản lý đơn hàng ({filteredOrders.length})
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Tìm kiếm, lọc, duyệt tay, xóa và xuất dữ liệu CSV.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={filteredOrders.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Xuất CSV
              </Button>
              <Button size="sm" variant="ghost" onClick={load}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo email, khách hàng, mã đơn, nội dung CK, sản phẩm..."
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ tiền về</option>
              <option value="paid">Đã thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="total_desc">Tổng tiền cao nhất</option>
              <option value="total_asc">Tổng tiền thấp nhất</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Không có đơn hàng phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-8 p-4 text-left font-mono"></th>
                  <th className="p-4 text-left font-mono">Khách hàng</th>
                  <th className="p-4 text-left font-mono">Nội dung CK</th>
                  <th className="p-4 text-left font-mono">Ngày</th>
                  <th className="p-4 text-right font-mono">Tổng</th>
                  <th className="p-4 text-center font-mono">Trạng thái</th>
                  <th className="p-4 text-right font-mono">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isOpen = expanded.has(order.id);
                  const isBusy = updating === order.id || deleting === order.id;
                  const cleanNote = getCleanNote(order.note);
                  const paymentContent = getPaymentContent(order.note);

                  return (
                    <Fragment key={order.id}>
                      <tr className="border-t border-border hover:bg-muted/20">
                        <td className="p-4">
                          <button onClick={() => toggle(order.id)} aria-label="Mở rộng" className="text-muted-foreground hover:text-foreground">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{order.full_name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{maskEmail(order.email)}</div>
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">{order.id.slice(0, 8)}</div>
                        </td>
                        <td className="p-4">
                          <button
                            className="inline-flex max-w-[280px] items-center gap-2 rounded border border-border px-2 py-1 font-mono text-xs text-primary hover:bg-primary/10"
                            onClick={() => copyPaymentContent(paymentContent)}
                            disabled={paymentContent === "-"}
                          >
                            <span className="truncate">{paymentContent}</span>
                            <Copy className="h-3.5 w-3.5 shrink-0" />
                          </button>
                        </td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                        <td className="p-4 text-right font-mono font-bold">{formatPrice(Number(order.total))}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block rounded border px-2 py-0.5 text-xs ${STATUS_STYLES[order.status] ?? "bg-muted"}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {order.status === "pending" && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" disabled={isBusy} className="h-8 text-success hover:text-success">
                                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Xác nhận
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Xác nhận đã thanh toán?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Chỉ bấm sau khi tiền đã về đúng số tiền và đúng nội dung:{" "}
                                        <span className="font-mono text-foreground">{paymentContent}</span>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => updateStatus(order.id, "paid")} className="bg-success text-success-foreground hover:bg-success/90">
                                        Đã nhận tiền
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <Button size="sm" variant="ghost" onClick={() => updateStatus(order.id, "cancelled")} disabled={isBusy} className="h-8 text-destructive hover:text-destructive">
                                  <XCircle className="mr-1 h-3.5 w-3.5" /> Hủy
                                </Button>
                              </>
                            )}
                            {order.status === "cancelled" && (
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(order.id, "pending")} disabled={isBusy} className="h-8">
                                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Đặt lại
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" disabled={isBusy} className="h-8 text-destructive hover:text-destructive">
                                  {deleting === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa</>}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa đơn hàng?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hành động này sẽ xóa vĩnh viễn đơn của <span className="font-semibold text-foreground">{order.full_name}</span>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Xóa đơn hàng
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="border-t border-border bg-muted/10">
                          <td />
                          <td colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs uppercase tracking-wider text-muted-foreground">Sản phẩm trong đơn</div>
                                {order.order_items?.length ? (
                                  <ul className="mt-2 space-y-1">
                                    {order.order_items.map((item) => (
                                      <li key={item.id} className="flex items-center justify-between text-sm">
                                        <span>
                                          {item.title} <span className="ml-2 font-mono text-xs uppercase text-muted-foreground">{item.license}</span>
                                        </span>
                                        <span className="font-mono">{formatPrice(Number(item.price))}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="mt-2 text-xs text-muted-foreground">Không có sản phẩm.</div>
                                )}
                              </div>

                              <div className="grid gap-3 border-t border-border pt-3 text-xs sm:grid-cols-3">
                                <div>
                                  <span className="text-muted-foreground">Tạm tính: </span>
                                  <span className="font-mono">{formatPrice(Number(order.subtotal))}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Phương thức: </span>
                                  <span className="font-mono">{order.payment_method}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Mã CK: </span>
                                  <span className="font-mono text-primary">{getPaymentCode(order.note)}</span>
                                </div>
                              </div>

                              {cleanNote && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Ghi chú: </span>
                                  {cleanNote}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

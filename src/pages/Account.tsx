import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileArchive, Heart, Loader2, LogOut, Package, Settings, Upload } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/data/products";
import type { CatalogProduct } from "@/data/products";
import { maskEmail } from "@/lib/privacy";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/store/wishlist";

const tabs = [
  { id: "orders", label: "Đơn hàng", icon: Package },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "wishlist", label: "Yêu thích", icon: Heart },
  { id: "settings", label: "Cài đặt", icon: Settings },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  paid: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

type AccountOrderItem = {
  id: string;
  title: string;
  license: string;
  price: number;
  product_id: string;
};

type AccountOrder = {
  id: string;
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  note: string | null;
  order_items: AccountOrderItem[];
};

type PaidItem = {
  order_id: string;
  product_id: string;
  title: string;
  license: string;
  price: number;
  preview: string;
  gradient: string;
  source_file_path: string | null;
  source_file_name: string | null;
  image_url: string | null;
};

const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Tên hiển thị tối thiểu 2 ký tự")
  .max(60, "Tên hiển thị tối đa 60 ký tự");

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

const shortOrderId = (id: string) => `CF-${id.slice(0, 4).toUpperCase()}`;

const getPaymentCode = (note: string | null) => note?.match(/PAYMENT_CODE:(\d{4})/)?.[1] ?? null;

const Account = () => {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("orders");
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paidItems, setPaidItems] = useState<PaidItem[]>([]);
  const [loadingPaid, setLoadingPaid] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const wishlistIds = useWishlist((state) => state.productIds);
  const [wishlistProducts, setWishlistProducts] = useState<CatalogProduct[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const paidOrderIds = useMemo(
    () => orders.filter((order) => order.status === "paid").map((order) => order.id),
    [orders],
  );

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, total, status, payment_method, note, order_items(id, product_id, title, license, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLoadingOrders(false);

      if (error) {
        toast({ title: "Lỗi tải đơn hàng", description: error.message, variant: "destructive" });
        return;
      }

      setOrders((data ?? []) as unknown as AccountOrder[]);
    };

    loadOrders();
  }, [user]);

  useEffect(() => {
    if (!user || active !== "downloads") return;

    const loadDownloads = async () => {
      setLoadingPaid(true);
      if (paidOrderIds.length === 0) {
        setPaidItems([]);
        setLoadingPaid(false);
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id, product_id, title, license, price, preview, gradient")
        .in("order_id", paidOrderIds);

      if (itemsError) {
        setLoadingPaid(false);
        toast({ title: "Lỗi tải downloads", description: itemsError.message, variant: "destructive" });
        return;
      }

      const productIds = Array.from(new Set((items ?? []).map((item) => item.product_id)));
      if (productIds.length === 0) {
        setPaidItems([]);
        setLoadingPaid(false);
        return;
      }

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, source_file_path, source_file_name, image_url")
        .in("id", productIds);

      setLoadingPaid(false);

      if (productsError) {
        toast({ title: "Lỗi tải source", description: productsError.message, variant: "destructive" });
        return;
      }

      const productMap = new Map((products ?? []).map((product) => [product.id, product]));
      setPaidItems(
        (items ?? []).map((item) => ({
          ...item,
          preview: item.preview ?? "✦",
          gradient: item.gradient ?? "from-primary/40 via-accent/30 to-secondary/40",
          source_file_path: productMap.get(item.product_id)?.source_file_path ?? null,
          source_file_name: productMap.get(item.product_id)?.source_file_name ?? null,
          image_url: productMap.get(item.product_id)?.image_url ?? null,
        })),
      );
    };

    loadDownloads();
  }, [active, paidOrderIds, user]);

  useEffect(() => {
    if (active !== "wishlist") return;

    const loadWishlist = async () => {
      setLoadingWishlist(true);
      if (wishlistIds.length === 0) {
        setWishlistProducts([]);
        setLoadingWishlist(false);
        return;
      }

      const { data, error } = await supabase.from("products").select("*").in("id", wishlistIds);
      setLoadingWishlist(false);

      if (error) {
        toast({ title: "Lỗi tải yêu thích", description: error.message, variant: "destructive" });
        return;
      }

      const productMap = new Map((data ?? []).map((product) => [product.id, product as CatalogProduct]));
      setWishlistProducts(wishlistIds.map((id) => productMap.get(id)).filter(Boolean) as CatalogProduct[]);
    };

    loadWishlist();
  }, [active, wishlistIds]);

  const handleDownload = async (item: PaidItem) => {
    if (!item.source_file_path) {
      toast({ title: "Chưa có file source", description: "Liên hệ admin để được hỗ trợ.", variant: "destructive" });
      return;
    }

    const key = `${item.order_id}-${item.product_id}`;
    setDownloadingKey(key);
    const { data, error } = await supabase.storage
      .from("product-sources")
      .createSignedUrl(item.source_file_path, 300, { download: item.source_file_name ?? true });
    setDownloadingKey(null);

    if (error || !data?.signedUrl) {
      toast({ title: "Tải xuống thất bại", description: error?.message ?? "Không tạo được link tải", variant: "destructive" });
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveName = async () => {
    const result = displayNameSchema.safeParse(displayName);
    if (!result.success) {
      toast({ title: "Tên không hợp lệ", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (!user) return;

    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ display_name: result.data }).eq("user_id", user.id);
    setSavingName(false);

    if (error) {
      toast({ title: "Lỗi cập nhật", description: error.message, variant: "destructive" });
      return;
    }

    await refreshProfile();
    toast({ title: "Đã lưu", description: "Tên hiển thị đã được cập nhật." });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast({ title: "Định dạng không hỗ trợ", description: "Chỉ chấp nhận JPG, PNG, WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({ title: "File quá lớn", description: "Kích thước tối đa 2MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      setUploadingAvatar(false);
      toast({ title: "Tải lên thất bại", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);

    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (updateError) {
      toast({ title: "Lỗi cập nhật avatar", description: updateError.message, variant: "destructive" });
      return;
    }

    await refreshProfile();
    toast({ title: "Đã cập nhật ảnh đại diện" });
  };

  const initials = (profile?.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="container py-12">
      <div className="mb-10 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : initials}
        </div>
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            Xin chào, {profile?.display_name ?? "bạn"}
            {isAdmin && <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase text-primary">Admin</span>}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{maskEmail(user?.email)}</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-fast ${
                active === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        <div className="min-h-[400px] rounded-xl border border-border bg-gradient-card p-6">
          {active === "orders" && (
            <>
              <h2 className="mb-4 font-display text-xl font-bold">Đơn hàng của bạn</h2>
              {loadingOrders ? (
                <div className="grid place-items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  Bạn chưa có đơn hàng nào.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-3 text-left font-mono">Mã đơn</th>
                        <th className="py-3 text-left font-mono">Ngày</th>
                        <th className="py-3 text-left font-mono">Sản phẩm</th>
                        <th className="py-3 text-left font-mono">Trạng thái</th>
                        <th className="py-3 text-right font-mono">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const paymentCode = getPaymentCode(order.note);
                        return (
                          <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3">
                              <div className="font-mono text-primary">{shortOrderId(order.id)}</div>
                              {paymentCode && <div className="mt-1 font-mono text-[11px] text-muted-foreground">CK: {paymentCode}</div>}
                            </td>
                            <td className="py-3 text-muted-foreground">{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                            <td className="py-3">{order.order_items?.length ?? 0}</td>
                            <td className="py-3">
                              <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_CLASS[order.status] ?? "bg-muted"}`}>
                                {STATUS_LABEL[order.status] ?? order.status}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono font-bold">{formatPrice(order.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {active === "downloads" && (
            <>
              <h2 className="mb-1 font-display text-xl font-bold">Source đã mua</h2>
              <p className="mb-4 text-sm text-muted-foreground">Source chỉ mở tải khi đơn hàng đã được xác nhận thanh toán.</p>
              {loadingPaid ? (
                <div className="grid place-items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : paidItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  Chưa có source nào khả dụng. Khi đơn được duyệt, link tải sẽ hiện ở đây.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {paidItems.map((item) => {
                    const key = `${item.order_id}-${item.product_id}`;
                    return (
                      <div key={key} className="rounded-lg border border-border bg-background/40 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded bg-gradient-to-br ${item.gradient} text-xl`}>
                            {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" /> : item.preview}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{item.title}</div>
                            <div className="font-mono text-xs uppercase text-muted-foreground">{item.license}</div>
                          </div>
                        </div>
                        <Button size="sm" className="w-full" disabled={!item.source_file_path || downloadingKey === key} onClick={() => handleDownload(item)}>
                          {downloadingKey === key ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Đang tạo link...
                            </>
                          ) : item.source_file_path ? (
                            <>
                              <FileArchive className="mr-2 h-3 w-3" /> Tải {item.source_file_name ?? "source"}
                            </>
                          ) : (
                            "Chưa có file source"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {active === "wishlist" && (
            <>
              <h2 className="mb-1 font-display text-xl font-bold">Sản phẩm yêu thích</h2>
              <p className="mb-4 text-sm text-muted-foreground">Những sản phẩm bạn đã lưu bằng nút trái tim.</p>
              {loadingWishlist ? (
                <div className="grid place-items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  Bạn chưa lưu sản phẩm nào.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {wishlistProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}

          {active === "settings" && (
            <div className="max-w-xl space-y-8">
              <div>
                <h2 className="mb-1 font-display text-xl font-bold">Hồ sơ cá nhân</h2>
                <p className="mb-6 text-sm text-muted-foreground">Cập nhật tên hiển thị và ảnh đại diện của bạn.</p>
              </div>

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Ảnh đại diện</Label>
                <div className="flex items-center gap-4">
                  <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-border bg-gradient-primary text-2xl font-bold text-primary-foreground">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> Tải ảnh lên
                        </>
                      )}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">JPG, PNG hoặc WEBP. Tối đa 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Tên hiển thị
                </Label>
                <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Lê Hoàng Quân" maxLength={60} />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input value={maskEmail(user?.email)} disabled />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveName} disabled={savingName || displayName === (profile?.display_name ?? "")}>
                  {savingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
                <Button variant="ghost" onClick={() => setDisplayName(profile?.display_name ?? "")} disabled={savingName}>
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;

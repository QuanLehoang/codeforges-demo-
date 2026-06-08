import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Loader2, Lock, MessageCircle, QrCode } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import paymentQr from "@/assets/payment-qr.png";

const BANK_INFO = {
  bank: "ZaloPay",
  accountHolder: "LE HOANG QUAN",
};

type CreatedOrder = {
  id: string;
  paymentCode: string;
  total: number;
};

const makePaymentCode = () => String(Math.floor(1000 + Math.random() * 9000));
const makePaymentContent = (code: string) => `chuyen khoan don hang so ${code}`;

const InfoRow = ({
  label,
  value,
  onCopy,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
  mono?: boolean;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    <div className="flex min-w-0 items-center gap-2">
      <span className={`truncate ${mono ? "font-mono" : ""} ${highlight ? "font-bold text-gradient" : "font-medium"}`}>{value}</span>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const Checkout = () => {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState("");
  const [note, setNote] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  const hasContactItems = items.some((item) => item.pricingMode === "contact");
  const isFreeOrder =
    items.length > 0 &&
    !hasContactItems &&
    items.every((item) => item.pricingMode === "free" || item.isFree || Number(item.price) === 0);
  const tax = 0;
  const total = isFreeOrder ? 0 : subtotal;
  const paymentContent = useMemo(
    () => (createdOrder ? makePaymentContent(createdOrder.paymentCode) : "Tao don hang de lay noi dung CK"),
    [createdOrder],
  );

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Da copy ${label}`);
  };

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasContactItems) {
      toast.error("San pham Contact inbox khong thanh toan truc tiep", {
        description: "Hay quay lai trang san pham va bam Contact inbox de bao gia rieng.",
      });
      return;
    }

    if (!email.trim() || !fullName.trim()) {
      toast.error("Vui long dien email va ho ten");
      return;
    }

    const orderId = crypto.randomUUID();
    const paymentCode = makePaymentCode();
    const paymentNote = [isFreeOrder ? "FREE_ORDER" : `PAYMENT_CODE:${paymentCode}`, note.trim()].filter(Boolean).join(" | ");
    setProcessing(true);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        user_id: user?.id ?? null,
        email: email.trim(),
        full_name: fullName.trim(),
        subtotal,
        tax,
        total,
        status: isFreeOrder ? "paid" : "pending",
        payment_method: isFreeOrder ? "free" : "bank_webhook",
        note: paymentNote,
      })
      .select("id, total")
      .single();

    if (error || !order) {
      setProcessing(false);
      toast.error("Tao don hang that bai", { description: error?.message });
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        title: item.title,
        license: item.license,
        price: item.price,
        preview: item.preview,
        gradient: item.gradient,
      })),
    );

    setProcessing(false);

    if (itemsError) {
      toast.error("Luu chi tiet don hang that bai", { description: itemsError.message });
      return;
    }

    clear();
    setCreatedOrder({
      id: order.id,
      total: Number(order.total),
      paymentCode,
    });
    toast.success(isFreeOrder ? "Da nhan san pham mien phi" : "Da tao don hang", {
      description: isFreeOrder ? "Don mien phi da duoc xac nhan, ban co the vao tai khoan de tai source." : "Hay chuyen dung so tien va dung noi dung de he thong xac nhan.",
      duration: 7000,
    });
  };

  if (items.length === 0 && !createdOrder) {
    return (
      <div className="container py-24 text-center">
        <h1 className="mb-4 font-display text-3xl">Gio hang trong</h1>
        <Button onClick={() => navigate("/catalog")}>Ve danh muc</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12">
      <h1 className="mb-2 font-display text-4xl font-bold">Thanh toan</h1>
      <p className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />{" "}
        {isFreeOrder ? "Don mien phi se bo qua chuyen khoan va duoc xac nhan ngay." : "He thong danh dau da thanh toan khi webhook hoac admin xac nhan tien da ve."}
      </p>

      {hasContactItems && (
        <div className="mb-8 rounded-xl border border-secondary/40 bg-secondary/10 p-4 text-sm text-secondary">
          <div className="flex items-center gap-2 font-semibold">
            <MessageCircle className="h-4 w-4" /> Gio hang co san pham Contact inbox
          </div>
          <p className="mt-1 text-secondary/80">San pham nay can bao gia rieng, khong thanh toan truc tiep bang chuyen khoan.</p>
        </div>
      )}

      <form onSubmit={createOrder} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-gradient-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Thong tin lien he</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required disabled={!!createdOrder} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Ho ten *</Label>
                <Input id="name" required disabled={!!createdOrder} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="note">Ghi chu tuy chon</Label>
              <Textarea id="note" rows={2} disabled={!!createdOrder} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </div>
          </section>

          {!isFreeOrder && !hasContactItems && (
            <section className="rounded-xl border border-border bg-gradient-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <QrCode className="h-4 w-4" /> Thanh toan chuyen khoan
              </h2>
              <div className="grid items-start gap-6 sm:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-lg border border-border bg-background p-2">
                  <img src={paymentQr} alt="Ma QR chuyen khoan" loading="lazy" width={512} height={640} className="h-auto w-full" />
                </div>
                <div className="space-y-3 text-sm">
                  <InfoRow label="Ngan hang" value={BANK_INFO.bank} onCopy={copy} />
                  <InfoRow label="Chu tai khoan" value={BANK_INFO.accountHolder} onCopy={copy} />
                  <InfoRow label="So tien" value={formatPrice(createdOrder?.total ?? total)} onCopy={copy} mono highlight />
                  <InfoRow label="Noi dung CK" value={paymentContent} onCopy={copy} mono highlight={!!createdOrder} />
                  <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                    {createdOrder ? (
                      <>
                        Hay nhap dung noi dung: <span className="font-mono text-foreground">{makePaymentContent(createdOrder.paymentCode)}</span>.
                      </>
                    ) : (
                      "Truoc khi chuyen khoan, hay bam tao don de lay noi dung chuyen khoan rieng."
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-gradient-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Don hang</h2>
            <div className="max-h-64 space-y-3 overflow-auto pr-2">
              {items.map((item) => (
                <div key={`${item.productId}-${item.license}`} className="flex items-center gap-3 text-sm">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br ${item.gradient}`}>
                    <span className="text-lg">{item.preview}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.title}</div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">{item.license}</div>
                  </div>
                  <div className="font-mono text-xs">
                    {item.pricingMode === "contact" ? "Contact inbox" : Number(item.price) === 0 ? "Mien phi" : formatPrice(item.price)}
                  </div>
                </div>
              ))}
              {createdOrder && (
                <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                  {isFreeOrder ? "Don mien phi da duoc xac nhan." : "Don da duoc tao. Hay cho he thong xac nhan khi tien ve."}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tam tinh</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold">
                <span>Tong</span>
                <span className="font-mono text-gradient">{formatPrice(total)}</span>
              </div>
            </div>

            {createdOrder ? (
              <Button type="button" size="lg" className="mt-6 w-full" variant="outline" onClick={() => navigate("/account")}>
                Xem don hang <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={processing || hasContactItems} className="mt-6 w-full bg-gradient-primary transition-shadow duration-base hover:shadow-glow">
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dang tao don...
                  </>
                ) : isFreeOrder ? (
                  <>Nhan mien phi</>
                ) : hasContactItems ? (
                  <>Can contact inbox</>
                ) : (
                  <>Tao don va lay noi dung CK</>
                )}
              </Button>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {isFreeOrder ? "San pham mien phi khong can chuyen khoan." : hasContactItems ? "Contact inbox khong tao don chuyen khoan." : "Kiem tra tien ve truoc khi duyet tay don hang."}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;

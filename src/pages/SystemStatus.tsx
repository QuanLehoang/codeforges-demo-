import { Activity, CheckCircle2, Server, ShieldCheck } from "lucide-react";

const services = [
  { name: "Website", desc: "Trang chủ, danh mục, giỏ hàng", status: "Đang hoạt động", icon: Activity },
  { name: "Supabase Auth", desc: "Đăng nhập, OTP Gmail, tài khoản", status: "Đang hoạt động", icon: ShieldCheck },
  { name: "Storage Source", desc: "Lưu file source và ảnh sản phẩm", status: "Đang hoạt động", icon: Server },
  { name: "Discord bot", desc: "Thông báo đơn hàng và thống kê thanh toán", status: "Theo Railway", icon: CheckCircle2 },
];

const SystemStatus = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-success">Status</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Trạng thái hệ thống</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Trang theo dõi nhanh các phần quan trọng của CodeForges. Khi có sự cố, bạn có thể cập nhật trạng thái ở đây.
      </p>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-2">
      {services.map((service) => (
        <div key={service.name} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-success/10 text-success">
              <service.icon className="h-5 w-5" />
            </div>
            <span className="rounded-md border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              {service.status}
            </span>
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">{service.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{service.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default SystemStatus;

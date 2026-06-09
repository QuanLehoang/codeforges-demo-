import { CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";

const allowed = [
  "Dùng trong dự án cá nhân hoặc thương mại theo gói đã mua.",
  "Chỉnh sửa source để phù hợp sản phẩm của bạn.",
  "Tải lại source trong trang tài khoản sau khi đơn đã thanh toán.",
];

const notAllowed = [
  "Bán lại source CodeForges như một template độc lập.",
  "Chia sẻ file source công khai hoặc upload lại lên marketplace khác.",
  "Dùng một license Personal cho nhiều team hoặc nhiều khách hàng.",
];

const LicenseTerms = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">License</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Điều khoản sử dụng</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Điều khoản này giúp việc bán source rõ ràng hơn: người mua biết được quyền sử dụng, còn CodeForges bảo vệ được sản phẩm.
      </p>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-gradient-card p-7">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Personal</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Dành cho cá nhân, freelancer hoặc một dự án thương mại nhỏ.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-gradient-card p-7">
        <FileText className="h-8 w-8 text-secondary" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Team</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Dành cho nhóm, agency hoặc nhiều dự án cần dùng chung source.
        </p>
      </div>
    </div>

    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-success/30 bg-success/10 p-7">
        <h2 className="font-display text-2xl font-semibold">Được phép</h2>
        <ul className="mt-5 space-y-3">
          {allowed.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-7">
        <h2 className="font-display text-2xl font-semibold">Không được phép</h2>
        <ul className="mt-5 space-y-3">
          {notAllowed.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-muted-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default LicenseTerms;

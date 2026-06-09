import { GitCommit, Sparkles } from "lucide-react";

const logs = [
  {
    version: "v0.4",
    title: "Thanh toán và Discord bot",
    items: ["Nội dung chuyển khoản theo mã 4 số", "Bot Discord tách kênh đơn hàng và kênh thanh toán", "Bỏ VAT khỏi checkout"],
  },
  {
    version: "v0.3",
    title: "Quản trị và source",
    items: ["Quản lý đơn hàng", "Tải source theo trạng thái thanh toán", "Che email người dùng ở dashboard/bot"],
  },
  {
    version: "v0.2",
    title: "Xác thực Gmail",
    items: ["Đăng ký bằng OTP Gmail", "Giao diện nhập mã từng ô", "SMTP riêng để giảm lỗi rate limit"],
  },
];

const Changelog = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Changelog</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Cập nhật CodeForges</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Ghi lại các thay đổi lớn của website để người mua biết hệ thống đang được nâng cấp đều đặn.
      </p>
    </div>

    <div className="mt-12 space-y-5">
      {logs.map((log) => (
        <div key={log.version} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-primary/10 px-3 py-1 font-mono text-sm text-primary">{log.version}</span>
            <h2 className="font-display text-xl font-semibold">{log.title}</h2>
          </div>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {log.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <GitCommit className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-6">
      <Sparkles className="h-6 w-6 text-primary" />
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Khi thêm sản phẩm mới, bạn có thể dùng trang này để thông báo phiên bản, tính năng mới và thay đổi license.
      </p>
    </div>
  </div>
);

export default Changelog;

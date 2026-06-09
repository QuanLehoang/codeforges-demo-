import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CreditCard, Download, MailCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: CreditCard,
    title: "Tạo đơn hàng",
    desc: "Chọn sản phẩm, nhập email và tạo đơn để nhận nội dung chuyển khoản riêng.",
  },
  {
    icon: MailCheck,
    title: "Chuyển khoản đúng nội dung",
    desc: "Nội dung CK có dạng: chuyển khoản đơn hàng số 1234. Mỗi đơn có 4 số riêng.",
  },
  {
    icon: CheckCircle2,
    title: "Xác nhận thanh toán",
    desc: "Khi tiền về tài khoản, admin hoặc webhook sẽ đổi trạng thái thành đã thanh toán.",
  },
  {
    icon: Download,
    title: "Tải source",
    desc: "Sau khi đơn đã thanh toán, tài khoản có thể tải file source trong trang tài khoản.",
  },
];

const Guide = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Purchase Guide</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Hướng dẫn mua hàng</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        CodeForges chỉ ghi nhận doanh thu khi đơn hàng được xác nhận thanh toán. Nếu sản phẩm miễn phí hoặc cần báo giá riêng,
        hệ thống sẽ bỏ qua bước chuyển khoản và hiển thị cách nhận/contact phù hợp.
      </p>
    </div>

    <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <step.icon className="h-5 w-5" />
            </div>
            <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <h2 className="font-display text-xl font-semibold">{step.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.desc}</p>
        </div>
      ))}
    </div>

    <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-xl border border-border bg-gradient-card p-7">
        <h2 className="font-display text-2xl font-semibold">Quy tắc chuyển khoản</h2>
        <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>Không bấm duyệt thủ công nếu muốn doanh thu chỉ ghi nhận theo tiền thực sự về tài khoản.</p>
          <p>Nội dung chuyển khoản phải khớp mã đơn để hệ thống đối chiếu nhanh và tránh nhầm đơn.</p>
          <p>Nếu chuyển khoản sai nội dung, hãy gửi ảnh giao dịch qua Discord hoặc email hỗ trợ để admin kiểm tra.</p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/10 p-7">
        <MessageCircle className="h-7 w-7 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Cần báo giá riêng?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Các sản phẩm gắn nhãn contact inbox sẽ không tính giá tự động. Bạn có thể nhắn Discord để trao đổi phạm vi,
          thời gian bàn giao và chi phí.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://discord.gg/m25qmWzWWY" target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-primary">
              Join group <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Link to="/catalog">
            <Button variant="outline">Xem danh mục</Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default Guide;

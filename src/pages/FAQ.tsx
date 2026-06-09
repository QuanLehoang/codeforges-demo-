import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Mã xác thực Gmail dùng để làm gì?",
    a: "Mã OTP dùng để xác nhận tài khoản thật trước khi truy cập đơn hàng, tải source và khu vực tài khoản.",
  },
  {
    q: "Khi nào tôi tải được source?",
    a: "Sau khi đơn hàng được đổi sang trạng thái đã thanh toán. Với sản phẩm miễn phí, hệ thống có thể bỏ qua thanh toán.",
  },
  {
    q: "Nếu chuyển khoản sai nội dung thì sao?",
    a: "Bạn gửi ảnh giao dịch qua Discord hoặc email hỗ trợ. Admin sẽ kiểm tra và duyệt đơn nếu giao dịch hợp lệ.",
  },
  {
    q: "Sản phẩm contact inbox hoạt động thế nào?",
    a: "Đây là sản phẩm cần báo giá riêng. Bạn gửi yêu cầu qua Discord để thống nhất phạm vi trước khi thanh toán.",
  },
  {
    q: "License Personal và Team khác nhau gì?",
    a: "Personal dành cho cá nhân hoặc một dự án nhỏ. Team dành cho nhóm, agency hoặc nhiều dự án thương mại.",
  },
];

const FAQ = () => (
  <div className="container py-14 md:py-20">
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Support</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Câu hỏi thường gặp</h1>
      <p className="mt-5 text-muted-foreground">Những câu hỏi hay gặp khi mua, xác thực tài khoản và nhận source CodeForges.</p>
    </div>

    <div className="mx-auto mt-12 max-w-4xl space-y-4">
      {faqs.map((faq) => (
        <div key={faq.q} className="rounded-xl border border-border bg-gradient-card p-6">
          <div className="flex gap-3">
            <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold">{faq.q}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    <p className="mt-10 text-center text-sm text-muted-foreground">
      Chưa thấy câu trả lời?{" "}
      <a href="mailto:codeforges.noreply@gmail.com" className="text-primary hover:underline">
        Gửi email hỗ trợ
      </a>{" "}
      hoặc vào{" "}
      <Link to="/guide" className="text-primary hover:underline">
        hướng dẫn mua hàng
      </Link>
      .
    </p>
  </div>
);

export default FAQ;

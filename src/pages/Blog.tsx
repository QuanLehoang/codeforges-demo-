import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";

const posts = [
  {
    title: "Cách mua source và nhận file an toàn",
    desc: "Giải thích luồng tạo đơn, chuyển khoản, xác nhận và tải source.",
    to: "/guide",
  },
  {
    title: "Cách chọn license phù hợp",
    desc: "Khi nào dùng Personal, khi nào nên dùng Team cho dự án thương mại.",
    to: "/license",
  },
  {
    title: "Theo dõi thanh toán bằng Discord bot",
    desc: "Ý tưởng vận hành bot để thông báo đơn đã thanh toán và thống kê doanh thu.",
    to: "/status",
  },
];

const Blog = () => (
  <div className="container py-14 md:py-20">
    <div className="max-w-3xl">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Blog</div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Tutorial & ghi chú vận hành</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Các bài viết ngắn giúp khách hiểu cách mua, còn admin có chỗ ghi lại cách vận hành website.
      </p>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {posts.map((post) => (
        <Link key={post.title} to={post.to} className="rounded-xl border border-border bg-gradient-card p-6 transition-colors hover:border-primary/50">
          <BookOpen className="h-7 w-7 text-primary" />
          <h2 className="mt-5 font-display text-xl font-semibold">{post.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.desc}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Đọc tiếp <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default Blog;

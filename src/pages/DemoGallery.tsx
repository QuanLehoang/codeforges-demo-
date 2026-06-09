import { Link } from "react-router-dom";
import { ArrowUpRight, MonitorPlay } from "lucide-react";

const demos = [
  { title: "Dashboard SaaS", tag: "Admin UI", gradient: "from-cyan-400 via-blue-500 to-violet-500" },
  { title: "Landing Product", tag: "Marketing", gradient: "from-fuchsia-500 via-violet-500 to-cyan-400" },
  { title: "Checkout Flow", tag: "Commerce", gradient: "from-emerald-400 via-cyan-500 to-blue-500" },
  { title: "WebGL Hero", tag: "Effects", gradient: "from-indigo-500 via-purple-500 to-pink-500" },
];

const DemoGallery = () => (
  <div className="container py-14 md:py-20">
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-3xl">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Demo Gallery</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Thư viện demo</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Nơi trưng bày các kiểu giao diện, hiệu ứng và flow có thể được đóng gói thành sản phẩm.
        </p>
      </div>
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        Xem danh mục <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>

    <div className="mt-12 grid gap-5 md:grid-cols-2">
      {demos.map((demo) => (
        <div key={demo.title} className="group overflow-hidden rounded-xl border border-border bg-gradient-card">
          <div className={`grid aspect-video place-items-center bg-gradient-to-br ${demo.gradient}`}>
            <MonitorPlay className="h-14 w-14 text-white/90 transition-transform group-hover:scale-110" />
          </div>
          <div className="p-6">
            <div className="font-mono text-xs uppercase text-primary">{demo.tag}</div>
            <h2 className="mt-2 font-display text-2xl font-semibold">{demo.title}</h2>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default DemoGallery;

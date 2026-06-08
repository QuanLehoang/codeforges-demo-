export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  price_team: number;
  pricing_mode?: "paid" | "free" | "contact";
  preview: string;
  gradient: string;
  image_url: string | null;
  author_name: string;
  author_handle: string;
  is_free: boolean;
  demo_url: string | null;
  buy_url: string | null;
  source_file_path: string | null;
  source_file_name: string | null;
  updated_at: string;
  created_at: string;
};

// Legacy demo type kept only for backward compatibility (no longer used)
export type Product = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: "ui-kit" | "template" | "component" | "effect" | "saas-starter";
  tags: string[];
  price: number; // VND
  priceTeam: number;
  rating: number;
  sales: number;
  stack: string[];
  preview: string; // emoji/glyph cover
  gradient: string; // tailwind gradient classes
  author: { name: string; handle: string };
  updatedAt: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "p_001", slug: "aurora-hero-kit",
    title: "Aurora Hero Kit",
    tagline: "12 hero sections với hiệu ứng aurora WebGL",
    description: "Bộ hero section cao cấp dùng React Three Fiber + GLSL shaders. Bao gồm Aurora, Plasma, Galaxy backgrounds tối ưu cho LCP.",
    category: "ui-kit", tags: ["hero", "webgl", "shader", "r3f"],
    price: 49000, priceTeam: 199000, rating: 4.9, sales: 1284,
    stack: ["React", "TypeScript", "R3F", "GLSL"],
    preview: "✦", gradient: "from-primary/40 via-accent/30 to-secondary/40",
    author: { name: "Nova Labs", handle: "@novalabs" },
    updatedAt: "2025-03-12",
  },
  {
    id: "p_002", slug: "magic-bento-grid",
    title: "Magic Bento Grid",
    tagline: "Bento layout với spotlight + tilt 3D",
    description: "Grid component bento responsive, follow-cursor spotlight, tilt parallax mượt 60fps.",
    category: "component", tags: ["bento", "grid", "tilt"],
    price: 29000, priceTeam: 119000, rating: 4.8, sales: 892,
    stack: ["React", "Framer Motion"],
    preview: "▦", gradient: "from-secondary/40 via-primary/30 to-accent/40",
    author: { name: "Pixel Forge", handle: "@pixelforge" },
    updatedAt: "2025-04-02",
  },
  {
    id: "p_003", slug: "saas-launch-template",
    title: "SaaS Launch Template",
    tagline: "Full-stack starter với auth + Stripe",
    description: "Template SaaS production-ready: Lovable Cloud auth, Stripe billing, dashboard, marketing site.",
    category: "saas-starter", tags: ["saas", "stripe", "auth"],
    price: 99000, priceTeam: 399000, rating: 5.0, sales: 562,
    stack: ["React", "TypeScript", "Stripe", "Cloud"],
    preview: "◈", gradient: "from-accent/40 via-secondary/30 to-primary/40",
    author: { name: "Stack Studio", handle: "@stackstudio" },
    updatedAt: "2025-04-10",
  },
  {
    id: "p_004", slug: "cursor-fx-pack",
    title: "Cursor FX Pack",
    tagline: "20 hiệu ứng con trỏ tương tác",
    description: "Bộ sưu tập custom cursor: Magnet, Blob, Splash, Ghost, Target, Crosshair, ImageTrail và nhiều hơn.",
    category: "effect", tags: ["cursor", "interaction", "canvas"],
    price: 19000, priceTeam: 79000, rating: 4.7, sales: 2104,
    stack: ["React", "Canvas", "WebGL"],
    preview: "✛", gradient: "from-primary/50 via-secondary/30 to-accent/40",
    author: { name: "Motion Co", handle: "@motionco" },
    updatedAt: "2025-02-28",
  },
  {
    id: "p_005", slug: "scroll-symphony",
    title: "Scroll Symphony",
    tagline: "Scroll-driven animations với GSAP",
    description: "12 scroll patterns: ScrollStack, Pinned reveals, Parallax layers, ScrollVelocity marquees.",
    category: "ui-kit", tags: ["scroll", "gsap", "parallax"],
    price: 39000, priceTeam: 159000, rating: 4.9, sales: 743,
    stack: ["GSAP", "ScrollTrigger", "React"],
    preview: "≋", gradient: "from-accent/40 via-primary/30 to-secondary/40",
    author: { name: "Nova Labs", handle: "@novalabs" },
    updatedAt: "2025-03-25",
  },
  {
    id: "p_006", slug: "glass-ui-system",
    title: "Glass UI System",
    tagline: "Liquid glass design system 80+ components",
    description: "Hệ thống thiết kế liquid glass với backdrop-filter, noise texture, refraction layers.",
    category: "ui-kit", tags: ["glass", "design-system", "components"],
    price: 59000, priceTeam: 249000, rating: 4.8, sales: 421,
    stack: ["React", "Tailwind", "Radix"],
    preview: "◌", gradient: "from-primary/30 via-accent/40 to-secondary/30",
    author: { name: "Glass Co", handle: "@glassco" },
    updatedAt: "2025-04-08",
  },
  {
    id: "p_007", slug: "particle-engine",
    title: "Particle Engine",
    tagline: "GPU particles cho landing page",
    description: "Engine hạt GPU-accelerated, 100k+ particles ở 60fps. Presets: galaxy, snow, rain, flow field.",
    category: "effect", tags: ["particles", "webgl", "gpu"],
    price: 35000, priceTeam: 145000, rating: 4.6, sales: 658,
    stack: ["Three.js", "GLSL"],
    preview: "✺", gradient: "from-secondary/40 via-accent/30 to-primary/40",
    author: { name: "Shader Den", handle: "@shaderden" },
    updatedAt: "2025-01-18",
  },
  {
    id: "p_008", slug: "admin-dash-pro",
    title: "Admin Dash Pro",
    tagline: "Dashboard template với 30+ charts",
    description: "Admin dashboard production: tables, charts, forms, sidebar nav, dark mode, RBAC patterns.",
    category: "template", tags: ["dashboard", "admin", "charts"],
    price: 79000, priceTeam: 329000, rating: 4.9, sales: 389,
    stack: ["React", "Recharts", "Tailwind"],
    preview: "▤", gradient: "from-accent/30 via-primary/40 to-secondary/30",
    author: { name: "Dash Team", handle: "@dashteam" },
    updatedAt: "2025-03-30",
  },
];

export const CATEGORIES = [
  { id: "all", label: "Tất cả", count: PRODUCTS.length },
  { id: "ui-kit", label: "UI Kits", count: PRODUCTS.filter(p => p.category === "ui-kit").length },
  { id: "template", label: "Templates", count: PRODUCTS.filter(p => p.category === "template").length },
  { id: "component", label: "Components", count: PRODUCTS.filter(p => p.category === "component").length },
  { id: "effect", label: "Effects", count: PRODUCTS.filter(p => p.category === "effect").length },
  { id: "saas-starter", label: "SaaS Starters", count: PRODUCTS.filter(p => p.category === "saas-starter").length },
] as const;

export const formatPrice = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} VND`;

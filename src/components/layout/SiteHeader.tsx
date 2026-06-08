import { useEffect, useMemo, useState } from "react";
import { Link, NavLink as RRNavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Loader2, LogOut, Search, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { maskEmail } from "@/lib/privacy";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type CatalogProduct } from "@/data/products";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", label: "Trang chủ" },
  { to: "/catalog", label: "Danh mục" },
];

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.8a13.7 13.7 0 0 0-.63 1.3 18.4 18.4 0 0 0-5.46 0 13.7 13.7 0 0 0-.64-1.3 19.7 19.7 0 0 0-4.95 1.57C.55 9.08-.32 13.67.1 18.2a20 20 0 0 0 6.07 3.06c.49-.66.92-1.36 1.29-2.1-.71-.27-1.39-.6-2.03-.97.17-.12.33-.25.49-.39a14.2 14.2 0 0 0 12.16 0c.16.14.32.27.49.39-.64.38-1.32.7-2.03.97.37.74.8 1.44 1.29 2.1a20 20 0 0 0 6.07-3.06c.5-5.24-.85-9.79-3.58-13.83ZM8.02 15.42c-1.18 0-2.16-1.08-2.16-2.41 0-1.34.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.41-2.16 2.41Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.41 0-1.34.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.41-2.16 2.41Z"
    />
  </svg>
);

const getPricingLabel = (product: CatalogProduct) => {
  const mode = product.pricing_mode ?? (product.is_free ? "free" : product.price <= 0 && product.price_team <= 0 ? "contact" : "paid");
  if (mode === "free") return "Miễn phí";
  if (mode === "contact") return "Contact inbox";
  return formatPrice(product.price);
};

export const SiteHeader = () => {
  const count = useCart((s) => s.items.length);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!searchOpen || products.length > 0 || loadingProducts) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80);
      setProducts((data ?? []) as CatalogProduct[]);
      setLoadingProducts(false);
    };

    loadProducts();
  }, [loadingProducts, products.length, searchOpen]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products.slice(0, 8);

    return products
      .filter((product) =>
        [product.title, product.tagline, product.category, product.author_handle, ...(product.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(keyword),
      )
      .slice(0, 8);
  }, [products, query]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const goToProduct = (slug: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(`/product/${slug}`);
  };

  const initials = (profile?.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link to="/" className="group">
          <BrandLogo iconClassName="h-9 w-9" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <RRNavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-md px-4 py-2 text-sm font-medium transition-colors duration-fast ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`
              }
            >
              {link.label}
            </RRNavLink>
          ))}

          {isAdmin && (
            <RRNavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-md px-4 py-2 text-sm font-medium transition-colors duration-fast ${
                  isActive ? "bg-secondary/10 text-secondary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`
              }
            >
              Quản trị
            </RRNavLink>
          )}

          <a
            href="https://discord.gg/m25qmWzWWY"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-shadow duration-base hover:shadow-glow"
          >
            <DiscordIcon className="h-4 w-4" />
            Join group
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Tìm kiếm" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>

          <Link to="/cart">
            <Button variant="ghost" size="icon" aria-label="Giỏ hàng" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-fade-in">
                  {count}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground transition-shadow hover:shadow-glow"
                  aria-label="Tài khoản"
                >
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate font-medium">{profile?.display_name ?? "User"}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">{maskEmail(user.email)}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <User className="mr-2 h-4 w-4" /> Tài khoản
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Quản trị
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-primary transition-shadow duration-base hover:shadow-glow">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tìm sản phẩm</DialogTitle>
            <DialogDescription>Tìm theo tên, danh mục, tag hoặc tác giả.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhập tên sản phẩm..."
              className="h-11 pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="grid place-items-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => goToProduct(product.slug)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br ${product.gradient}`}>
                    {product.image_url ? <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" /> : product.preview}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{product.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{product.tagline}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-primary">{getPricingLabel(product)}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{product.category}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

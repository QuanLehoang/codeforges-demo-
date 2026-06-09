import { Link } from "react-router-dom";
import { Globe, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
    <path d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.8a13.7 13.7 0 0 0-.63 1.3 18.4 18.4 0 0 0-5.46 0 13.7 13.7 0 0 0-.64-1.3 19.7 19.7 0 0 0-4.95 1.57C.55 9.08-.32 13.67.1 18.2a20 20 0 0 0 6.07 3.06c.49-.66.92-1.36 1.29-2.1-.71-.27-1.39-.6-2.03-.97.17-.12.33-.25.49-.39a14.2 14.2 0 0 0 12.16 0c.16.14.32.27.49.39-.64.38-1.32.7-2.03.97.37.74.8 1.44 1.29 2.1a20 20 0 0 0 6.07-3.06c.5-5.24-.85-9.79-3.58-13.83ZM8.02 15.42c-1.18 0-2.16-1.08-2.16-2.41 0-1.34.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.41-2.16 2.41Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.41 0-1.34.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.41-2.16 2.41Z" />
  </svg>
);

export const SiteFooter = () => (
  <footer className="mt-24 border-t border-border/60">
    <div className="container grid gap-10 py-12 md:grid-cols-4">
      <div className="space-y-3">
        <BrandLogo iconClassName="h-9 w-9" />
        <p className="max-w-xs text-sm text-muted-foreground">
          Marketplace cho component, template và hiệu ứng front-end cao cấp.
        </p>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Khám phá</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link to="/catalog" className="transition-colors hover:text-foreground">
              Danh mục
            </Link>
          </li>
          <li>
            <Link to="/demo-gallery" className="transition-colors hover:text-foreground">
              Demo gallery
            </Link>
          </li>
          <li>
            <Link to="/blog" className="transition-colors hover:text-foreground">
              Blog & tutorial
            </Link>
          </li>
          <li>
            <Link to="/changelog" className="transition-colors hover:text-foreground">
              Changelog
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Tài khoản</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link to="/account" className="transition-colors hover:text-foreground">
              Đơn hàng
            </Link>
          </li>
          <li>
            <Link to="/account" className="transition-colors hover:text-foreground">
              Downloads
            </Link>
          </li>
          <li>
            <Link to="/account" className="transition-colors hover:text-foreground">
              License keys
            </Link>
          </li>
          <li>
            <Link to="/guide" className="transition-colors hover:text-foreground">
              Hướng dẫn mua hàng
            </Link>
          </li>
          <li>
            <Link to="/license" className="transition-colors hover:text-foreground">
              License
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Hỗ trợ</h4>
        <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
          <li>
            <Link to="/faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
          </li>
          <li>
            <Link to="/status" className="transition-colors hover:text-foreground">
              Trạng thái hệ thống
            </Link>
          </li>
          <li>
            <Link to="/affiliate" className="transition-colors hover:text-foreground">
              Affiliate
            </Link>
          </li>
        </ul>
        <div className="flex gap-2 text-muted-foreground">
          <a
            href="/"
            className="grid h-9 w-9 place-items-center rounded-md transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Website"
          >
            <Globe className="h-4 w-4" />
          </a>
          <a
            href="mailto:codeforges.noreply@gmail.com"
            className="grid h-9 w-9 place-items-center rounded-md transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Email"
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href="https://discord.gg/m25qmWzWWY"
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-9 w-9 place-items-center rounded-md transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Discord"
          >
            <DiscordIcon className="h-4 w-4 fill-current" />
          </a>
        </div>
      </div>
    </div>

    <div className="border-t border-border/60">
      <div className="container flex flex-col justify-between gap-2 py-6 text-xs text-muted-foreground md:flex-row">
        <span>
          © {new Date().getFullYear()} CodeForge · Chủ sở hữu{" "}
          <span className="font-medium text-foreground">Lê Hoàng Quân</span>
        </span>
        <span className="font-mono">v0.2.0 · auth-enabled</span>
      </div>
    </div>
  </footer>
);

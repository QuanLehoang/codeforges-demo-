import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export const BrandLogo = ({ className, iconClassName, textClassName, showText = true }: BrandLogoProps) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="relative shrink-0">
      <div className="absolute -inset-1 rounded-2xl bg-cyan-400/35 blur-lg opacity-70 transition-opacity duration-base group-hover:opacity-100" />
      <img
        src="/codeforges-logo.png"
        alt="CodeForges"
        className={cn(
          "relative h-10 w-10 rounded-xl object-cover shadow-[0_0_22px_hsl(198_95%_55%_/_0.45)]",
          iconClassName,
        )}
      />
    </div>
    {showText && (
      <span className={cn("font-display font-bold text-lg tracking-tight", textClassName)}>
        Code<span className="text-gradient">Forges</span>
      </span>
    )}
  </div>
);

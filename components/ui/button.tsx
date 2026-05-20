import { cn } from "@/lib/utils";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-baby-blue text-deep-brown hover:bg-baby-blue/80",
  secondary: "bg-light-pink text-deep-brown hover:bg-light-pink/80",
  outline:
    "border-2 border-warm-border bg-transparent text-deep-brown hover:bg-cream",
  ghost: "bg-transparent text-deep-brown hover:bg-cream",
  danger: "border border-soft-red/30 bg-soft-red/15 text-soft-red hover:bg-soft-red/25",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-6 py-4 text-lg",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 focus:ring-offset-parchment disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href) {
    if (props.disabled) {
      return (
        <span className={cn(classes, "cursor-not-allowed")}>
          {children}
        </span>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

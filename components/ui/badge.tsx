import { cn } from "@/lib/utils";

type BadgeVariant = "sage" | "blue" | "pink" | "brown";

const variantClasses: Record<BadgeVariant, string> = {
  sage: "bg-sage/20 text-sage",
  blue: "bg-baby-blue/40 text-deep-brown",
  pink: "bg-light-pink/40 text-deep-brown",
  brown: "bg-deep-brown/10 text-deep-brown",
};

export function Badge({
  children,
  variant = "sage",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantClasses[variant]
      )}
    >
      {children}
    </span>
  );
}

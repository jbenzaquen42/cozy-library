import { cn } from "@/lib/utils";

type CardVariant = "cream" | "blue" | "pink" | "white";

const variantClasses: Record<CardVariant, string> = {
  cream: "bg-cream border-warm-border",
  blue: "bg-baby-blue/30 border-blue-border",
  pink: "bg-light-pink/30 border-pink-border",
  white: "bg-white/70 border-warm-border",
};

export function Card({
  children,
  variant = "cream",
  title,
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5 shadow-lg shadow-amber-shadow/5",
        variantClasses[variant],
        className
      )}
    >
      {title && (
        <h2 className="font-heading text-lg font-semibold text-deep-brown">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

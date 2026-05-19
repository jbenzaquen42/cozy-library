import { BookOpen } from "lucide-react";
import { Button } from "./button";

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-warm-border bg-cream p-8 text-center shadow-lg shadow-amber-shadow/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-baby-blue/40">
        <BookOpen className="h-8 w-8 text-deep-brown" />
      </div>
      <h3 className="mt-4 font-heading text-xl font-semibold text-deep-brown">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-muted-text">{message}</p>
      {action && (
        <Button href={action.href} variant="primary" className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}

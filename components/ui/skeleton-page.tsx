import { Skeleton } from "./skeleton";

export function SkeletonPage({ variant = "default" }: { variant?: "default" | "catalog" | "detail" }) {
  if (variant === "catalog") {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-72" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-48 w-32 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-32 w-full rounded-3xl" />
    </div>
  );
}

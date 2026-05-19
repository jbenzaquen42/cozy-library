export function PageHeader({
  label,
  title,
  children,
}: {
  label?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {label && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sage">
          {label}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold text-deep-brown sm:text-4xl">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

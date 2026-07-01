import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Ambient warm blobs — the page's signature element */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-gradient-to-br from-bubble-own-from to-bubble-own-to opacity-30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-[-6rem] size-96 rounded-full bg-secondary opacity-60 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-bubble-own-from to-bubble-own-to text-2xl shadow-lg shadow-primary/20">
            🍑
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/5">
          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";

/** A desk panel: code + title bar, optional shortcut/link, hairline frame. */
export function Panel({
  code,
  title,
  meta,
  href,
  hrefLabel,
  live,
  className = "",
  bodyClass = "",
  children,
}: {
  code: string;
  title: string;
  meta?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  live?: boolean;
  className?: string;
  bodyClass?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col border border-t-line bg-t-panel ${className}`}>
      <header className="t-mono flex h-9 shrink-0 items-center gap-3 border-b border-t-line px-3 text-[11.5px]">
        <span className="text-t-amber">{code}</span>
        <span className="text-t-text">{title}</span>
        {live && <span className="t-blink h-1.5 w-1.5 rounded-full bg-t-amber" aria-label="live" />}
        {meta && <span className="truncate text-t-dim">{meta}</span>}
        {href && (
          <Link href={href} className="group ml-auto flex items-center gap-1.5 text-t-dim hover:text-t-amber">
            {hrefLabel ?? "open"} <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </header>
      <div className={`relative min-h-0 flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

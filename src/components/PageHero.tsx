/**
 * Terminal page header: a breadcrumb path, one big wide headline that types
 * itself in once (the page's entrance), a plain lede and the page's controls.
 */
export function PageHero({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="t-scan border-b border-t-line pb-8 pt-24">
      <div className="mx-auto max-w-[1440px] px-5">
        <p className="t-mono text-[12px] text-t-dim">
          breach / <span className="text-t-text">{kicker.toLowerCase()}</span>
          <span className="t-blink ml-1 text-t-amber">▍</span>
        </p>
        <h1 className="t-head t-type mt-5 max-w-[1200px] text-[clamp(40px,6.6vw,100px)] text-t-text">{title}</h1>
        {sub && <div className="mt-5 max-w-[640px] text-[15.5px] leading-relaxed text-t-dim">{sub}</div>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

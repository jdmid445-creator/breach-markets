import { INTRO } from "@/lib/media";
import { TextReveal } from "./unlumen/text-reveal";

/**
 * Cinematic page header shared by every inner page: the underwater clip
 * dimmed behind caustic light and sonar contours, a blur-in headline, and
 * a soft fade into the page.
 */
export function PageHero({
  kicker,
  title,
  sub,
  children,
  compact = false,
}: {
  kicker: string;
  title: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`relative overflow-hidden ${compact ? "pt-28 pb-14" : "pt-32 pb-20"}`}>
      <video
        src={INTRO.dive}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="caustics pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="contours drift pointer-events-none absolute -inset-[8%] opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,38,.55)_0%,rgba(10,15,38,.35)_45%,#0a0f26_100%)]" aria-hidden />
      <div className="relative mx-auto max-w-[1240px] px-5">
        <p className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.2em] text-aqua">
          <span className="h-px w-8 bg-aqua/60" /> {kicker}
        </p>
        <TextReveal as="h1" text={title} className="display mt-5 max-w-[1100px] text-[clamp(44px,7.4vw,112px)] !leading-[0.95]" staggerDelay={0.06} />
        {sub && <div className="mt-6 max-w-[620px] text-[16.5px] leading-relaxed text-bone/75">{sub}</div>}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}

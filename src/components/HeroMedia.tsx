// Hero background: Higgsfield whale video loop under a sonar contour texture.

// Generated with Higgsfield (Seedance 2.0). Swap for /hero.mp4 once copied into /public.
const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3MUqZwnnpETfFdEYnthNWyEXOMb/hf_20261123_065121_9ece4116-be39-49d4-a5c7-6bd4c605adcd.mp4";

export function HeroMedia() {
  const hasVideo = Boolean(HERO_VIDEO);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {hasVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          src={HERO_VIDEO}
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="contours drift absolute -inset-[8%]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-ink)_0%,rgba(15,16,21,.82)_45%,rgba(15,16,21,.25)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}

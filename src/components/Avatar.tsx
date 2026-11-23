/* eslint-disable @next/next/no-img-element */
const HUES = ["#1d4f80", "#2a5f92", "#356b96", "#4a82ad", "#25557f", "#5b8fb8"];

export function Avatar({ src, seed, size = 32 }: { src?: string; seed: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="block shrink-0 rounded-full object-cover ring-1 ring-hair"
        style={{ width: size, height: size }}
      />
    );
  }
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = HUES[h % HUES.length];
  const b = HUES[(h >>> 3) % HUES.length];
  return (
    <span
      aria-hidden
      className="block shrink-0 rounded-full ring-1 ring-hair"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${a}, ${b})` }}
    />
  );
}

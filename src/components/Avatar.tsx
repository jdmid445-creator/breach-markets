/* eslint-disable @next/next/no-img-element */
const HUES = ["#105BFF", "#2a3350", "#3b4a7a", "#1d2a55", "#5a6b9e"];

export function Avatar({ src, seed, size = 32 }: { src?: string; seed: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="shrink-0 rounded-full object-cover ring-1 ring-line"
        style={{ width: size, height: size }}
      />
    );
  }
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = HUES[h % HUES.length];
  const b = HUES[(h >> 3) % HUES.length];
  return (
    <span
      aria-hidden
      className="shrink-0 rounded-full ring-1 ring-line"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${a}, ${b})` }}
    />
  );
}

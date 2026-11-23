/* eslint-disable @next/next/no-img-element */

/** Polymarket profile picture, or the trader's initial on a quiet tile. */
export function Avatar({ src, seed, name = "", size = 32 }: { src?: string; seed: string; name?: string; size?: number }) {
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
  const initial = (name.match(/[A-Za-z0-9]/)?.[0] ?? seed.slice(2, 3)).toUpperCase();
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-reef font-semibold text-stone-hi ring-1 ring-hair"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
}

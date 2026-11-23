const TAIL =
  "M28.6 50 C29 45 29.4 41.5 29.6 38.6 C23.5 38.2 15.6 34.8 10.5 24.2 C10.2 23.4 10.9 22.8 11.6 23.3 C17.8 27.4 25 28.8 30.4 30.2 C31.1 30.4 31.6 31 32 31.8 C32.4 31 32.9 30.4 33.6 30.2 C39 28.8 46.2 27.4 52.4 23.3 C53.1 22.8 53.8 23.4 53.5 24.2 C48.4 34.8 40.5 38.2 34.4 38.6 C34.6 41.5 35 45 35.4 50 Z";

export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#105BFF" />
      <path transform="translate(0 -4.4)" d={TAIL} fill="#EDEBE6" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={32} />
      <span className="display text-[26px] tracking-wide">Breach</span>
    </span>
  );
}

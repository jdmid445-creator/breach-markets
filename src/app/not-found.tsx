import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-10 pt-40 md:px-8">
      <h1 className="title text-[clamp(30px,3.6vw,46px)] text-fg">Nothing charted here</h1>
      <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-mist">
        That page or wallet doesn’t exist. Wallet links need a full 0x address with 40 characters after the 0x.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/live" className="press inline-flex h-10 items-center rounded-lg bg-stone-hi px-4 text-[14px] font-semibold text-sea hover:bg-fg">
          Open whale alerts
        </Link>
        <Link href="/leaderboard" className="press inline-flex h-10 items-center rounded-lg border border-hair-2 px-4 text-[14px] text-fg hover:bg-reef">
          Leaderboards
        </Link>
      </div>
    </div>
  );
}

"use client";
// Scroll-stacking console, adapted from the MotionSites "Nimbus Sticky Cards"
// section: each card slides up over the last and leaves a header strip behind.
// Every card's right side is a live window built from real Polymarket data.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Trade, Trader } from "@/lib/pm";
import { usd, cents } from "@/lib/format";
import { Avatar } from "./Avatar";

type Pod = { title: string; outcome: string; whales: number; value: number };

export function WaterConsole({ trades, leaders, pod }: { trades: Trade[]; leaders: Trader[]; pod: Pod[] }) {
  const section = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const CARDS = [
    {
      key: "live",
      tab: "Whale alerts",
      title: "Every $10K bet, the second it lands",
      body: "Breach watches the whole order flow and surfaces only the money that matters, tiered from Whale to Blue whale.",
      href: "/live",
      cta: "Open whale alerts",
      visual: <LiveWindow trades={trades} on={active === 0} />,
    },
    {
      key: "boards",
      tab: "Leaderboards",
      title: "Who’s actually printing",
      body: "Profit rankings by window, category and sport, including the 1-hour and per-sport boards Polymarket doesn’t publish.",
      href: "/leaderboard",
      cta: "See the boards",
      visual: <BoardWindow leaders={leaders} on={active === 1} />,
    },
    {
      key: "pod",
      tab: "Smart money",
      title: "When the sharpest wallets agree",
      body: "We read the open books of the month’s top 30 traders and flag the bets they’re stacking together.",
      href: "/smart-money",
      cta: "Follow the pod",
      visual: <PodWindow pod={pod} on={active === 2} />,
    },
    {
      key: "profile",
      tab: "Whale profiles",
      title: "Read any wallet like a scouting report",
      body: "Profit by window, rank, what they hold right now, where they play, and every move they’ve made lately.",
      href: leaders[0] ? `/trader/${leaders[0].address}` : "/leaderboard",
      cta: "Open a profile",
      visual: <ProfileWindow t={leaders[0]} trades={trades} on={active === 3} />,
    },
  ];

  useEffect(() => {
    const update = () => {
      const sec = section.current;
      const st = stack.current;
      if (!sec || !st) return;
      const rect = sec.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const max = CARDS.length - 1;
      const raw = progress * max;
      const h = st.clientHeight;
      const strip = window.innerWidth <= 820 ? 50 : 54;
      const ys = CARDS.map((_, i) => {
        if (i === 0) return 0;
        const seg = Math.min(1, Math.max(0, raw - (i - 1)));
        const start = h + strip;
        const end = i * strip;
        return Math.round(start + (end - start) * seg);
      });
      cards.current.forEach((el, i) => {
        if (!el) return;
        const next = ys[i + 1];
        const visible = typeof next === "number" ? Math.max(strip, Math.min(h, next + 2)) : h;
        el.style.transform = `translateY(${ys[i]}px)`;
        el.style.clipPath = `inset(0 0 ${Math.max(0, h - visible)}px 0)`;
        el.style.zIndex = String(i + 1);
      });
      setActive(Math.min(max, Math.max(0, Math.round(raw))));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jump = (i: number) => {
    const sec = section.current;
    if (!sec) return;
    const scrollable = sec.offsetHeight - window.innerHeight;
    window.scrollTo({ top: sec.offsetTop + (i / (CARDS.length - 1)) * scrollable + 2, behavior: "smooth" });
  };

  return (
    <section
      ref={section}
      className="plex relative border-t border-aqua/10"
      style={{ minHeight: "420svh", background: "radial-gradient(circle at 86% 30%, rgba(116,255,237,.10), transparent 26rem), #070b1d" }}
    >
      <h2 className="sr-only">What Breach reads</h2>
      <div className="sticky top-0 grid h-[100svh] grid-cols-[minmax(170px,.24fr)_minmax(0,.76fr)] gap-[clamp(28px,5vw,72px)] overflow-hidden px-[clamp(20px,5vw,72px)] py-[clamp(48px,7vw,86px)] max-[820px]:grid-cols-1 max-[820px]:grid-rows-[auto_1fr] max-[820px]:gap-5 max-[820px]:py-8">
        {/* Tabs */}
        <div className="self-start pt-3 max-[820px]:pt-0">
          <p className="plex-mono mb-8 text-[11px] uppercase tracking-[0.12em] text-bone/40 max-[820px]:mb-4">/ read the water</p>
          <div role="tablist" className="grid gap-4 max-[820px]:grid-cols-2 max-[820px]:gap-3">
            {CARDS.map((c, i) => (
              <button
                key={c.key}
                role="tab"
                aria-selected={active === i}
                onClick={() => jump(i)}
                className={`plex-mono flex items-center text-left text-[11px] uppercase tracking-[0.08rem] transition-[color,transform] duration-200 ${
                  active === i ? "translate-x-0.5 text-aqua" : "text-bone/40 hover:text-bone/70"
                }`}
              >
                <span className={`mr-3 inline-block h-[7px] w-[7px] rounded-[1px] bg-current transition-transform duration-300 ${active === i ? "rotate-45" : ""}`} />
                {c.tab}
              </button>
            ))}
          </div>
          <div className="plex-mono mt-10 text-[11px] text-bone/35 max-[820px]:hidden">
            {String(active + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}
            <div className="mt-3 h-px w-32 bg-bone/10">
              <div className="h-px bg-aqua transition-[width] duration-500" style={{ width: `${((active + 1) / CARDS.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Stack */}
        <div ref={stack} className="relative self-center overflow-hidden max-[820px]:self-stretch" style={{ height: "min(80svh, 820px)" }} aria-live="polite">
          {CARDS.map((c, i) => (
            <article
              key={c.key}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className="absolute inset-0 grid grid-cols-[minmax(230px,.36fr)_minmax(320px,.64fr)] border-t border-bone/20 bg-[#070b1d] will-change-[transform,clip-path] max-[820px]:grid-cols-1 max-[820px]:grid-rows-[auto_1fr]"
              style={{ transform: i === 0 ? "translateY(0)" : "translateY(100%)" }}
            >
              <div className="pr-8 pt-5 max-[820px]:pb-5 max-[820px]:pr-0">
                <div className="plex-mono flex items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-aqua/80">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px w-6 bg-aqua/40" />
                  <span>{c.tab}</span>
                </div>
                <h3 className="mt-6 text-[clamp(24px,2.3vw,42px)] font-light leading-[1.15] text-bone">{c.title}</h3>
                <p className="mt-6 max-w-[340px] text-[clamp(15px,1.25vw,19px)] leading-[1.6] text-bone/60">{c.body}</p>
                <Link href={c.href} className="plex-mono group mt-9 inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.1em] text-aqua">
                  {c.cta}
                  <span className="inline-block h-px w-8 bg-aqua transition-[width] duration-300 group-hover:w-14" />
                </Link>
              </div>
              <div
                className="relative flex min-h-full items-center overflow-hidden p-[clamp(26px,4.5vw,60px)]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(116,255,237,.88), rgba(43,111,134,.78) 55%, rgba(23,31,68,.92)), radial-gradient(circle at 15% 20%, rgba(234,246,245,.6), transparent 20rem)",
                }}
              >
                <div className="contours pointer-events-none absolute -inset-[10%] opacity-40 mix-blend-overlay" aria-hidden />
                <div className="relative w-full transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: active === i ? "translateY(0) scale(1)" : "translateY(14px) scale(.97)" }}>{c.visual}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- windows ---------- */

function Window({ title, children, live }: { title: string; children: React.ReactNode; live?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[470px] rounded-lg bg-[rgba(7,11,29,.9)] px-5 pb-6 pt-4 shadow-[0_28px_70px_rgba(0,0,0,.38)] ring-1 ring-white/5">
      <div className="flex items-center gap-1.5">
        <span className="h-[7px] w-[7px] rounded-full bg-bone/50" />
        <span className="h-[7px] w-[7px] rounded-full bg-bone/30" />
        <span className="h-[7px] w-[7px] rounded-full bg-bone/20" />
        <span className="plex-mono ml-auto flex items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] text-bone/45">
          {live && <span className="live-dot" />}
          {title}
        </span>
      </div>
      <div className="plex-mono mt-5 text-[clamp(11px,.95vw,13.5px)] leading-[1.6] text-bone/85">{children}</div>
    </div>
  );
}

function LiveWindow({ trades, on }: { trades: Trade[]; on: boolean }) {
  const [n, setN] = useState(0);
  const list = trades.slice(0, 12);
  useEffect(() => {
    if (!on || !list.length) return;
    const id = setInterval(() => setN((x) => (x + 1) % list.length), 1600);
    return () => clearInterval(id);
  }, [on, list.length]);
  const rows = list.length ? Array.from({ length: Math.min(6, list.length) }, (_, i) => list[(n + i) % list.length]) : [];
  return (
    <Window title="whale feed" live>
      {rows.length === 0 && <div className="text-bone/50">waiting for whales…</div>}
      {rows.map((t, i) => (
        <div key={`${t.id}-${n}-${i}`} className={`grid grid-cols-[18px_76px_1fr] gap-2 ${i === 0 ? "row-in text-bone" : "text-bone/60"}`}>
          <span className={t.side === "BUY" ? "text-aqua" : "text-down"}>{t.side === "BUY" ? "▲" : "▼"}</span>
          <span className={t.usd >= 250_000 ? "text-pink" : ""}>{usd(t.usd)}</span>
          <span className="truncate">
            {t.rank ? <b className="text-aqua">#{t.rank} {t.name} </b> : null}
            {t.outcome} @{cents(t.price)} · {t.title}
          </span>
        </div>
      ))}
      <div className="caret mt-3 text-bone/40">listening</div>
    </Window>
  );
}

function BoardWindow({ leaders, on }: { leaders: Trader[]; on: boolean }) {
  const top = leaders.slice(0, 6);
  const max = Math.max(...top.map((t) => Math.abs(t.pnl)), 1);
  return (
    <Window title="top profit · 7d">
      {top.length === 0 && <div className="text-bone/50">no board data</div>}
      {top.map((t, i) => (
        <div key={t.address} className="grid grid-cols-[22px_1fr_80px] items-center gap-3 py-[3px]">
          <span className="text-bone/40">{String(i + 1).padStart(2, "0")}</span>
          <span className="min-w-0">
            <span className="block truncate">{t.name}</span>
            <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-bone/10">
              <span
                className="block h-full rounded-full bg-aqua transition-[width] duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ width: on ? `${(Math.abs(t.pnl) / max) * 100}%` : "0%", transitionDelay: `${i * 90}ms` }}
              />
            </span>
          </span>
          <span className={`text-right ${t.pnl >= 0 ? "text-aqua" : "text-down"}`}>{usd(t.pnl, { sign: true })}</span>
        </div>
      ))}
    </Window>
  );
}

function PodWindow({ pod, on }: { pod: Pod[]; on: boolean }) {
  return (
    <Window title="consensus · top 30">
      {pod.length === 0 && <div className="text-bone/50">reading the books…</div>}
      {pod.slice(0, 4).map((p, i) => (
        <div key={`${p.title}-${p.outcome}`} className="border-b border-bone/10 py-2 last:border-0">
          <div className="flex justify-between gap-4">
            <span className="truncate text-bone">{p.title}</span>
            <span className="shrink-0 text-bone/60">{usd(p.value)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-bone/55">
            <span className="rounded bg-aqua/15 px-1.5 text-aqua">{p.outcome}</span>
            <span className="flex gap-[3px]">
              {Array.from({ length: Math.min(p.whales, 12) }, (_, j) => (
                <span
                  key={j}
                  className="h-2 w-2 rounded-full bg-aqua transition-[opacity,transform] duration-500"
                  style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0)", transitionDelay: `${i * 120 + j * 40}ms` }}
                />
              ))}
            </span>
            <span>{p.whales} wallets</span>
          </div>
        </div>
      ))}
    </Window>
  );
}

function ProfileWindow({ t, trades, on }: { t?: Trader; trades: Trade[]; on: boolean }) {
  if (!t) return <Window title="profile">no profile</Window>;
  const theirs = trades.filter((x) => x.wallet === t.address).slice(0, 3);
  return (
    <Window title="whale profile">
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-[2px] transition-shadow duration-700 ${on ? "shadow-[0_0_0_2px_#74ffed,0_0_24px_rgba(116,255,237,.5)]" : ""}`}>
          <Avatar src={t.image} seed={t.address} size={40} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-bone">{t.name}</div>
          <div className="text-[11px] text-bone/45">
            {t.address.slice(0, 6)}…{t.address.slice(-4)}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-aqua">{usd(t.pnl, { sign: true })}</div>
          <div className="text-[11px] text-bone/45">7d · #{t.rank}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
        {[
          ["volume", usd(t.volume)],
          ["rank", `#${t.rank}`],
          ["verified", t.verified ? "yes" : "no"],
        ].map(([k, v]) => (
          <div key={k} className="rounded bg-bone/5 px-2 py-1.5">
            <div className="text-bone/40">{k}</div>
            <div className="text-bone">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-[11px] uppercase tracking-[0.1em] text-bone/40">recent</div>
      {(theirs.length ? theirs : trades.slice(0, 2)).map((x) => (
        <div key={x.id} className="flex justify-between gap-3 text-bone/70">
          <span className="truncate">
            {x.side === "BUY" ? "bought" : "sold"} {x.outcome} · {x.title}
          </span>
          <span className="shrink-0">{usd(x.usd)}</span>
        </div>
      ))}
    </Window>
  );
}

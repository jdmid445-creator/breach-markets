"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Trader } from "@/lib/pm";
import { MiniBoard } from "./Boards";

/** One board, three markets: switch between them in place. */
export function BoardSwitch({ boards, className = "" }: { boards: { id: string; label: string; href: string; rows: Trader[] | null }[]; className?: string }) {
  const [on, setOn] = useState(boards[0].id);
  const b = boards.find((x) => x.id === on) ?? boards[0];
  return (
    <section className={`flex min-w-0 flex-col border-t border-hair-2 ${className}`}>
      <header className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 border-b border-hair px-4 py-1.5">
        <h2 className="text-[14.5px] font-semibold text-fg">Top profit, 7 days</h2>
        <div role="tablist" aria-label="Market" className="flex gap-1">
          {boards.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={x.id === on}
              onClick={() => setOn(x.id)}
              className={`press rounded-md px-2.5 py-1 text-[13px] ${x.id === on ? "bg-reef font-semibold text-fg" : "text-mist hover:text-fg"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <Link href={b.href} className="press group ml-auto flex items-center gap-1 text-[13px] text-mist hover:text-fg">
          Full board
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </header>
      <div role="tabpanel">
        <MiniBoard key={b.id} rows={b.rows} />
      </div>
    </section>
  );
}

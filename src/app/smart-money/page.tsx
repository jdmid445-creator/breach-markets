import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usd, cents, pmMarket } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { podConsensus, type Consensus } from "@/lib/smart";
import { Avatar } from "@/components/Avatar";
import { PageHeader, Empty, MarketIcon } from "@/components/desk/ui";
import { RevealRow } from "@/components/fx/motion";

export const revalidate = 600;
export const metadata = { title: "Smart money — Breach" };

export default async function SmartMoneyPage() {
  const rows = (await podConsensus(30).catch(() => [])).slice(0, 40);

  return (
    <>
      <PageHeader
        title="Smart money"
        sub="We read the open positions of the 30 most profitable traders this month and list the bets two or more of them share, most shared first. Refreshed every 10 minutes."
      />
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="overflow-x-auto border-t border-hair-2">
          {rows.length === 0 ? (
            <Empty>No shared positions right now, or Polymarket didn’t answer. Check back in a few minutes.</Empty>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hair text-[12.5px] text-faint">
                  <th className="whitespace-nowrap px-3 py-2.5 font-normal sm:px-4">Market and side</th>
                  <th className="whitespace-nowrap px-3 py-2.5 font-normal max-md:hidden sm:px-4">Top 30 traders holding it</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right font-normal max-sm:hidden sm:px-4">Price now</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right font-normal sm:px-4">Combined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <Row key={a.key} a={a} lead={i === 0} i={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ a, lead, i }: { a: Consensus; lead: boolean; i: number }) {
  const faces = a.whales.filter(({ t }) => t.image).slice(0, 6);
  return (
    <RevealRow i={i} className="spot-row border-b border-hair last:border-0">
      <td className={`w-full max-w-0 px-3 sm:px-4 ${lead ? "py-5" : "py-3"}`}>
        <a href={pmMarket(a.eventSlug, a.slug)} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3">
          <MarketIcon src={a.icon} label={a.title} size={lead ? 48 : 34} />
          <span className="min-w-0">
            <span className={`flex items-center gap-1 text-fg ${lead ? "title text-[22px]" : "text-[14.5px]"}`}>
              <span className="truncate group-hover:underline">{a.title}</span>
              <ArrowUpRight size={14} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className={`block text-faint ${lead ? "mt-1 text-[14px]" : "text-[13px]"}`}>
              <span className="font-semibold text-stone-hi">{a.outcome}</span> · {bucketLabel(a.bucket)}
              {lead && <span> · the most shared bet right now</span>}
            </span>
          </span>
        </a>
      </td>
      <td className="px-3 py-3 max-md:hidden sm:px-4">
        <div className="flex items-center gap-3">
          {faces.length > 0 && (
            <span className="group/faces flex -space-x-2 transition-all duration-300 hover:space-x-1">
              {faces.map(({ t }) => (
                <Link key={t.address} href={`/trader/${t.address}`} title={t.name} className="rounded-full ring-2 ring-sea transition-transform duration-150 hover:z-10 hover:-translate-y-0.5">
                  <Avatar src={t.image} seed={t.address} name={t.name} size={26} />
                </Link>
              ))}
            </span>
          )}
          <span className="whitespace-nowrap text-[14px] text-mist">
            <span className={`fig font-semibold text-fg ${lead ? "text-[18px]" : ""}`}>{a.whales.length}</span> of 30
          </span>
        </div>
      </td>
      <td className="fig px-3 py-3 text-right text-[14px] text-mist max-sm:hidden sm:px-4">{cents(a.price)}</td>
      <td className={`fig px-3 py-3 text-right font-semibold text-fg sm:px-4 ${lead ? "text-[20px]" : "text-[15px]"}`}>{usd(a.value)}</td>
    </RevealRow>
  );
}

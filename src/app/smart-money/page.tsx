import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usd, cents, pmMarket } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { podConsensus } from "@/lib/smart";
import { Avatar } from "@/components/Avatar";
import { PageHeader, Empty, MarketIcon } from "@/components/desk/ui";

export const revalidate = 600;
export const metadata = { title: "Smart money — Breach" };

export default async function SmartMoneyPage() {
  const rows = (await podConsensus(30).catch(() => [])).slice(0, 40);
  const lead = rows[0];
  const rest = rows.slice(1);
  const maxWhales = Math.max(...rows.map((r) => r.whales.length), 2);

  return (
    <>
      <PageHeader
        title="Smart money"
        sub="We read the open positions of the 30 most profitable traders this month and list the bets two or more of them share, most shared first. Refreshed every 10 minutes."
      />
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        {!lead && (
          <div className="rounded-lg border border-hair bg-shoal">
            <Empty>No shared positions right now, or Polymarket didn’t answer. Check back in a few minutes.</Empty>
          </div>
        )}

        {lead && (
          <article className="grid gap-6 rounded-lg border border-hair-2 bg-reef/60 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="min-w-0">
              <a href={pmMarket(lead.eventSlug, lead.slug)} target="_blank" rel="noreferrer" className="group flex items-start gap-4">
                <MarketIcon src={lead.icon} label={lead.title} size={52} />
                <span className="title text-[clamp(24px,2.8vw,36px)] text-fg group-hover:underline">{lead.title}</span>
              </a>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="flex -space-x-2.5">
                  {lead.whales.slice(0, 10).map(({ t }) => (
                    <Link key={t.address} href={`/trader/${t.address}`} title={t.name} className="rounded-full ring-2 ring-reef transition-transform duration-150 hover:z-10 hover:-translate-y-0.5">
                      <Avatar src={t.image} seed={t.address} size={34} />
                    </Link>
                  ))}
                </span>
                <span className="text-[14.5px] text-mist">
                  <b className="text-fg">{lead.whales.length} of the top 30</b> hold{" "}
                  <span className="rounded-md bg-stone-hi px-1.5 py-0.5 text-[13px] font-semibold text-sea">{lead.outcome}</span>
                  <span className="text-faint"> · {bucketLabel(lead.bucket)}</span>
                </span>
              </div>
            </div>
            <dl className="grid grid-cols-2 content-end gap-x-10 gap-y-1 md:text-right">
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-[12.5px] text-faint">Combined position</dt>
                <dd className="fig text-[34px] font-semibold leading-none text-fg">{usd(lead.value)}</dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-[12.5px] text-faint">Price now</dt>
                <dd className="fig text-[34px] font-semibold leading-none text-fg">{cents(lead.price)}</dd>
              </div>
            </dl>
          </article>
        )}

        {rest.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-hair bg-shoal">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hair text-[12.5px] text-faint">
                  <th className="px-3 py-2.5 sm:px-4 font-normal">Market and side</th>
                  <th className="px-3 py-2.5 sm:px-4 font-normal max-md:hidden">Top traders holding it</th>
                  <th className="px-3 py-2.5 sm:px-4 text-right font-normal max-sm:hidden">Price now</th>
                  <th className="px-3 py-2.5 sm:px-4 text-right font-normal">Combined</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((a) => (
                  <tr key={a.key} className="row border-b border-hair last:border-0">
                    <td className="w-full max-w-0 px-3 py-3 sm:px-4">
                      <a href={pmMarket(a.eventSlug, a.slug)} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3">
                        <MarketIcon src={a.icon} label={a.title} size={34} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[14.5px] text-fg">
                            <span className="truncate group-hover:underline">{a.title}</span>
                            <ArrowUpRight size={13} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          </span>
                          <span className="block text-[13px] text-faint">
                            <span className="font-semibold text-stone-hi">{a.outcome}</span> · {bucketLabel(a.bucket)}
                          </span>
                        </span>
                      </a>
                    </td>
                    <td className="px-3 py-3 sm:px-4 max-md:hidden">
                      <div className="flex items-center gap-3">
                        <span className="flex -space-x-2">
                          {a.whales.slice(0, 6).map(({ t }) => (
                            <Link key={t.address} href={`/trader/${t.address}`} title={t.name} className="rounded-full ring-2 ring-shoal transition-transform duration-150 hover:z-10 hover:-translate-y-0.5">
                              <Avatar src={t.image} seed={t.address} size={26} />
                            </Link>
                          ))}
                        </span>
                        <span className="fig text-[14px] text-fg">{a.whales.length}</span>
                        <span className="h-[5px] w-24 rounded-full bg-reef">
                          <span className="bar-in block h-full rounded-full bg-stone" style={{ width: `${(a.whales.length / maxWhales) * 100}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="fig px-3 py-3 sm:px-4 text-right text-[14px] text-mist max-sm:hidden">{cents(a.price)}</td>
                    <td className="fig px-3 py-3 sm:px-4 text-right text-[15px] font-semibold text-fg">{usd(a.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

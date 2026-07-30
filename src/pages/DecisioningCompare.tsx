import { Calendar, Download, Info, TrendingUp } from "lucide-react";

const metricCards = [
  {
    title: "Conversion rate",
    engine: "8.4%",
    control: "7.1%",
    lift: "+18.3% Lift",
    positive: true,
  },
  {
    title: "Revenue per customer",
    engine: "₹142",
    control: "₹121",
    lift: "+17.4% Lift",
    positive: true,
  },
  {
    title: "Repeat purchases",
    engine: "41,280",
    control: "35,740",
    lift: "+5,540 Lift",
    positive: true,
  },
  {
    title: "Cost per conversion",
    engine: "₹84",
    control: "₹96",
    lift: "-12.5% Lift",
    positive: true,
  },
];

function LiftBadge({ children, positive = true }: { children: React.ReactNode; positive?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-manrope text-[11px] font-semibold ${
        positive ? "bg-[#E7EFEA] text-[#00A576]" : "bg-[#FCE8E8] text-[#D3453E]"
      }`}
    >
      {children}
    </span>
  );
}

function MetricCompareCard({
  title,
  engine,
  control,
  lift,
  positive,
}: {
  title: string;
  engine: string;
  control: string;
  lift: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E6EAF4] bg-white p-4">
      <div className="font-manrope text-[13px] font-semibold text-[#17173A]">{title}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="font-manrope text-[22px] font-extrabold leading-none text-[#17173A]">{engine}</div>
          <div className="mt-1 font-manrope text-[11px] text-[#6F6F8D]">Decisioning Engine</div>
        </div>
        <div className="text-right">
          <div className="font-manrope text-[18px] font-bold leading-none text-[#9A9AB0]">{control}</div>
          <div className="mt-1 font-manrope text-[11px] text-[#9A9AB0]">Control</div>
        </div>
      </div>
      <div className="mt-3 border-t border-[#EEF1F7] pt-3">
        <LiftBadge positive={positive}>{lift}</LiftBadge>
      </div>
    </div>
  );
}

export default function DecisioningCompare() {
  return (
    <div className="bg-[#F5F7FB] px-[54px] py-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-manrope text-[22px] font-bold text-[#17173A]">Control comparison</h1>
            <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
              See how the Decisioning Engine is performing against the control group.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DDE2EE] bg-white px-3 font-manrope text-[12px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
            >
              <Calendar className="h-3.5 w-3.5 text-[#6F6F8D]" strokeWidth={2} />
              Last 30 days (12 Aug – 10 Sept)
            </button>
            <span className="inline-flex items-center gap-1 font-manrope text-[12px] text-[#6F6F8D]">
              Attribution window: <strong className="font-semibold text-[#17173A]">7 days</strong>
              <Info className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DDE2EE] bg-white px-3 font-manrope text-[12px] font-semibold text-[#17173A] transition-colors hover:bg-[#F4F8FF]"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              Export
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E6EAF4] bg-white p-5">
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#E6EAF4] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#2F68E5]" />
                <div>
                  <div className="font-manrope text-[12px] font-semibold text-[#17173A]">Decisioning Engine</div>
                  <div className="font-manrope text-[11px] text-[#6F6F8D]">1,082,312 users</div>
                </div>
              </div>
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[#E6EAF4] bg-[#F5F7FB] font-manrope text-[10px] font-bold text-[#9A9AB0]">
                vs
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-[#E6EAF4] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#B8BCC8]" />
                <div>
                  <div className="font-manrope text-[12px] font-semibold text-[#17173A]">Control group</div>
                  <div className="font-manrope text-[11px] text-[#6F6F8D]">120,256 users</div>
                </div>
              </div>
            </div>

            <div className="h-10 w-px bg-[#E6EAF4] max-lg:hidden" />

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E7EFEA]">
                  <TrendingUp className="h-5 w-5 text-[#00A576]" strokeWidth={2.2} />
                </span>
                <div>
                  <div className="font-manrope text-[26px] font-extrabold leading-none text-[#00A576]">
                    +12.4%
                  </div>
                  <div className="mt-1 font-manrope text-[12px] font-medium text-[#6F6F8D]">
                    incremental conversions
                  </div>
                  <div className="font-manrope text-[11px] text-[#9A9AB0]">
                    Compared with the control group over the last 30 days
                  </div>
                </div>
              </div>

              <div className="ml-auto flex flex-wrap gap-6">
                <div>
                  <div className="font-manrope text-[18px] font-extrabold text-[#17173A]">+2,840</div>
                  <div className="font-manrope text-[11px] text-[#6F6F8D]">Incremental conversions</div>
                </div>
                <div>
                  <div className="font-manrope text-[18px] font-extrabold text-[#17173A]">₹18.6L</div>
                  <div className="font-manrope text-[11px] text-[#6F6F8D]">Incremental revenue</div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1">
                    <span className="font-manrope text-[18px] font-extrabold text-[#17173A]">96%</span>
                    <Info className="h-3.5 w-3.5 text-[#9A9AB0]" strokeWidth={2} />
                  </div>
                  <div className="font-manrope text-[11px] text-[#6F6F8D]">Statistical confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <MetricCompareCard key={metric.title} {...metric} />
          ))}
        </div>
      </div>
    </div>
  );
}

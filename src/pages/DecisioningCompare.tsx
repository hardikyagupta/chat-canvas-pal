import {
  Calendar,
  CheckCircle2,
  Download,
  Info,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#2F68E5";
const CONTROL = "#B8BCC8";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E6EAF4",
  boxShadow: "0px 8px 24px rgba(23,23,58,0.10)",
  fontFamily: "Manrope, sans-serif",
  fontSize: 12,
};

const cumulativeConversions = [
  { date: "12 Aug", engine: 2800, control: 2200 },
  { date: "15 Aug", engine: 5200, control: 4100 },
  { date: "18 Aug", engine: 8100, control: 6400 },
  { date: "21 Aug", engine: 11200, control: 8900 },
  { date: "24 Aug", engine: 14800, control: 11800 },
  { date: "27 Aug", engine: 18900, control: 15200 },
  { date: "30 Aug", engine: 23400, control: 19100 },
  { date: "2 Sept", engine: 28100, control: 23200 },
  { date: "5 Sept", engine: 32800, control: 27400 },
  { date: "8 Sept", engine: 36200, control: 31200 },
  { date: "10 Sept", engine: 38500, control: 35660 },
].map((row) => ({
  ...row,
  incremental: row.engine - row.control,
}));

const topCohorts = [
  { name: "One-time buyers inactive 30–60 days", conversions: 1120, lift: 24, bar: 100 },
  { name: "High-value app users", conversions: 860, lift: 18, bar: 77 },
  { name: "Recent category browsers", conversions: 580, lift: 13, bar: 52 },
  { name: "Loyal customers at risk", conversions: 280, lift: 9, bar: 25 },
];

const experimentHealth = [
  { label: "Control allocation", value: "10%" },
  { label: "Sample size", value: "120,420 users" },
  { label: "Confidence level", value: "96%" },
  { label: "Test duration", value: "30 days" },
  { label: "Group balance", value: "Healthy" },
  { label: "Contamination detected", value: "None" },
];

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

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#E6EAF4] bg-white p-5 ${className}`}>
      <div className={`mb-4 flex items-start justify-between gap-3 ${action ? "" : ""}`}>
        <div>
          <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 font-manrope text-[12px] text-[#6F6F8D]">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

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
        {/* Header */}
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

        {/* Hero summary */}
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

        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <MetricCompareCard key={metric.title} {...metric} />
          ))}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Panel
            title="Cumulative conversions over time"
            subtitle="Decisioning Engine vs control group"
            className="xl:col-span-6"
            action={
              <select className="h-8 rounded-lg border border-[#DDE2EE] bg-white px-2 font-manrope text-[12px] font-medium text-[#17173A] outline-none">
                <option>Conversions</option>
                <option>Revenue</option>
              </select>
            }
          >
            <div className="mb-3 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-manrope text-[11px] text-[#6F6F8D]">
                <span className="h-2 w-2 rounded-full bg-[#2F68E5]" />
                Decisioning Engine
              </span>
              <span className="inline-flex items-center gap-1.5 font-manrope text-[11px] text-[#6F6F8D]">
                <span className="h-2 w-2 rounded-full bg-[#B8BCC8]" />
                Control group
              </span>
              <span className="inline-flex items-center gap-1.5 font-manrope text-[11px] text-[#6F6F8D]">
                <span className="h-2 w-4 rounded-sm bg-[#D6E6FF]" />
                Incremental gain
              </span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cumulativeConversions} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EEF1F7" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9A9AB0" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E6EAF4" }}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9A9AB0" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}K`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === "incremental") return [value.toLocaleString(), "Incremental gain"];
                      if (name === "engine") return [value.toLocaleString(), "Decisioning Engine"];
                      return [value.toLocaleString(), "Control group"];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="control"
                    stackId="gain"
                    stroke="none"
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="incremental"
                    stackId="gain"
                    stroke="none"
                    fill="url(#gainFill)"
                  />
                  <Line
                    type="monotone"
                    dataKey="control"
                    stroke={CONTROL}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="engine"
                    stroke={BRAND}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-end">
              <span className="rounded-lg bg-[#EEF3FF] px-2.5 py-1 font-manrope text-[11px] font-semibold text-[#2F68E5]">
                +2,840 Incremental conversions
              </span>
            </div>
          </Panel>

          <Panel
            title="What drove the improvement?"
            subtitle="Top performing cohorts"
            className="xl:col-span-3"
          >
            <div className="space-y-4">
              {topCohorts.map((cohort, index) => (
                <div key={cohort.name}>
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <span className="font-manrope text-[12px] font-medium leading-snug text-[#17173A]">
                      {index + 1}. {cohort.name}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F0F2F8]">
                    <div
                      className="h-full rounded-full bg-[#2F68E5]"
                      style={{ width: `${cohort.bar}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-manrope text-[11px] font-semibold text-[#2F68E5]">
                      +{cohort.conversions.toLocaleString()}
                    </span>
                    <LiftBadge>+{cohort.lift}% Lift</LiftBadge>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 font-manrope text-[12px] font-semibold text-[#2F68E5] hover:underline"
            >
              View all cohorts
            </button>
          </Panel>

          <Panel title="Experiment health" className="xl:col-span-3">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#E7EFEA] px-2.5 py-1 font-manrope text-[11px] font-semibold text-[#00A576]">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              Results are reliable
            </div>
            <dl className="space-y-3">
              {experimentHealth.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <dt className="font-manrope text-[12px] text-[#6F6F8D]">{item.label}</dt>
                  <dd className="font-manrope text-[12px] font-semibold text-[#17173A]">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}

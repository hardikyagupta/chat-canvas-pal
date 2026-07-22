import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  MousePointerClick,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ObjectiveJourneyPreview, {
  type EditableStep,
} from "@/components/decisioning/ObjectiveJourneyPreview";
import {
  useDecisioningSetup,
  type LaunchedObjective,
} from "@/contexts/DecisioningSetupContext";
import "@/components/decisioning/config-edit.css";

/**
 * Live performance page for a launched decisioning objective. Reached from the
 * "View live performance" CTA on an ObjectiveCard.
 *
 * Chrome mirrors the "Edit configuration" page: the same sticky white navbar
 * (title lockup + close X), no other CTAs. Below it, two tabs — Performance
 * (metrics + charts) and Preview (the same audience/sub-cohort/channel/
 * template tree used in the objective creation flow's own Preview step,
 * rendered read-only — editable={false} disables every edit affordance,
 * leaving only the template eye/preview icons active).
 */

type Tab = "performance" | "preview";

const BRAND = "#2F68E5";

/* Demo data — mirrors the prototype's in-memory story. */
const revenueTrend = [
  { day: "Jul 06", revenue: 180, conversions: 4 },
  { day: "Jul 07", revenue: 240, conversions: 6 },
  { day: "Jul 08", revenue: 210, conversions: 5 },
  { day: "Jul 09", revenue: 320, conversions: 8 },
  { day: "Jul 10", revenue: 290, conversions: 7 },
  { day: "Jul 11", revenue: 410, conversions: 11 },
  { day: "Jul 12", revenue: 380, conversions: 9 },
  { day: "Jul 13", revenue: 460, conversions: 12 },
  { day: "Jul 14", revenue: 520, conversions: 14 },
  { day: "Jul 15", revenue: 480, conversions: 13 },
  { day: "Jul 16", revenue: 610, conversions: 16 },
  { day: "Jul 17", revenue: 560, conversions: 15 },
  { day: "Jul 18", revenue: 690, conversions: 18 },
  { day: "Jul 19", revenue: 740, conversions: 20 },
];

const channelPerformance = [
  { channel: "Email", conversions: 62, sent: 4200 },
  { channel: "App push", conversions: 41, sent: 3100 },
  { channel: "SMS", conversions: 28, sent: 1800 },
  { channel: "Web push", conversions: 17, sent: 2400 },
];

const actionMix = [
  { name: "Second-purchase offer", value: 44, color: "#2F68E5" },
  { name: "Complete-the-set", value: 26, color: "#7C5CFF" },
  { name: "Free-express unlock", value: 18, color: "#00C48C" },
  { name: "Comeback offer", value: 12, color: "#F5A623" },
];

const funnel = [
  { stage: "Reached", value: 11500 },
  { stage: "Delivered", value: 10820 },
  { stage: "Opened", value: 4310 },
  { stage: "Clicked", value: 1290 },
  { stage: "Converted", value: 148 },
];

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  positive = true,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E6EAF4] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EEF3FF]">
          <Icon className="h-[18px] w-[18px] text-[#2F68E5]" strokeWidth={1.9} />
        </span>
        {delta ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-manrope text-[11px] font-semibold ${
              positive
                ? "bg-[#E7EFEA] text-[#00A576]"
                : "bg-[#FCE8E8] text-[#D3453E]"
            }`}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
            ) : (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2.4} />
            )}
            {delta}
          </span>
        ) : null}
      </div>
      <div>
        <div className="font-manrope text-[24px] font-extrabold leading-none text-[#17173A]">
          {value}
        </div>
        <div className="mt-1.5 font-manrope text-[12px] font-medium text-[#6F6F8D]">
          {label}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#E6EAF4] bg-white p-5">
      <div className="mb-4">
        <h3 className="font-manrope text-[15px] font-bold text-[#17173A]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 font-manrope text-[12px] text-[#6F6F8D]">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E6EAF4",
  boxShadow: "0px 8px 24px rgba(23,23,58,0.10)",
  fontFamily: "Manrope, sans-serif",
  fontSize: 12,
};

export default function DecisioningPerformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { objectives } = useDecisioningSetup();

  const objective =
    (location.state as { objective?: LaunchedObjective } | null)?.objective ??
    objectives[0] ??
    null;

  const [tab, setTab] = useState<Tab>("performance");

  const title = objective?.title ?? "Repeat purchase objective is running";
  const exit = () => navigate("/decisioning-engine");

  return (
    <div className="decfg-flow flex h-screen flex-col overflow-hidden">
      {/* Navbar — cloned from the Edit configuration header: title + close only */}
      <header className="decfg-navbar">
        <div className="decfg-title-lockup">
          <span
            className="decfg-thumbnail"
            style={{
              backgroundImage:
                "linear-gradient(35deg, #010818 20%, #0160de 51%, #f08fe9 84%)",
              color: "#fff",
            }}
          >
            <Sparkles strokeWidth={1.9} />
          </span>
          <strong>{title}</strong>
          <span className="ml-1 inline-flex items-center gap-1 rounded-[4px] bg-[#30B756] py-0.5 pl-1 pr-2 font-manrope text-[11px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Live
          </span>
        </div>
        <div className="decfg-actions">
          <button className="decfg-close" aria-label="Close" onClick={exit}>
            <X strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 border-b border-[#E6EAF4] bg-white px-[54px]">
        <div className="flex gap-6">
          {(
            [
              { id: "performance", label: "Performance" },
              { id: "preview", label: "Preview" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 py-3 font-manrope text-[14px] font-semibold transition-colors ${
                tab === t.id
                  ? "border-[#2F68E5] text-[#2F68E5]"
                  : "border-transparent text-[#6F6F8D] hover:text-[#17173A]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body — the only scrollable region (the global body is position:fixed,
          so each page must scroll inside its own container). */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "performance" ? (
          <PerformanceTab objective={objective} />
        ) : (
          <div className="mx-auto w-full max-w-[1200px] px-[54px] py-8">
            <ObjectiveJourneyPreview onEdit={(_s: EditableStep) => {}} editable={false} />
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({
  objective,
}: {
  objective: LaunchedObjective | null;
}) {
  const revenue = objective?.revenue ?? "$3,130";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-[54px] py-8">
      {/* Sent banner (mirrors the campaign performance page) */}
      <div className="mb-6 rounded-lg bg-[#EEF1FF] px-4 py-3 font-manrope text-[13px] text-[#4A4A6A]">
        This objective went live on{" "}
        <em className="font-semibold not-italic">Jul 06, 2026</em> and is
        optimizing the next best action in real time.
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={DollarSign}
          label="Revenue generated"
          value={revenue}
          delta="12.4%"
        />
        <StatCard
          icon={Target}
          label="Conversions"
          value="148"
          delta="8.1%"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion rate"
          value="1.29%"
          delta="0.3%"
        />
        <StatCard
          icon={Users}
          label="Contacts reached"
          value="11,500"
          delta="5.6%"
        />
        <StatCard icon={Send} label="Messages sent" value="11.5K" />
        <StatCard
          icon={MousePointerClick}
          label="Uplift vs hold-out"
          value="+22%"
          delta="3.2%"
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue & conversions"
            subtitle="Daily attributed revenue over the last 14 days"
          >
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueTrend}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EEF1F7" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#9A9AB0" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E6EAF4" }}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9A9AB0" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue ($)"
                    stroke={BRAND}
                    strokeWidth={2.5}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Next best action mix"
          subtitle="Share of decisions by action"
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={actionMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {actionMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, fontFamily: "Manrope, sans-serif" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Conversions by channel"
          subtitle="Where the engine is driving outcomes"
        >
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelPerformance}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid stroke="#EEF1F7" vertical={false} />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 11, fill: "#9A9AB0" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E6EAF4" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9A9AB0" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F4F8FF" }} />
                <Bar
                  dataKey="conversions"
                  name="Conversions"
                  fill={BRAND}
                  radius={[6, 6, 0, 0]}
                  barSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Engagement funnel"
          subtitle="From reach to conversion"
        >
          <div className="flex h-[240px] flex-col justify-center gap-2.5">
            {funnel.map((f, i) => {
              const pct = (f.value / funnel[0].value) * 100;
              return (
                <div key={f.stage} className="flex items-center gap-3">
                  <span className="w-[72px] shrink-0 font-manrope text-[12px] font-medium text-[#6F6F8D]">
                    {f.stage}
                  </span>
                  <div className="h-7 flex-1 overflow-hidden rounded-md bg-[#F4F8FF]">
                    <div
                      className="flex h-full items-center justify-end rounded-md pr-2"
                      style={{
                        width: `${Math.max(pct, 8)}%`,
                        background: `linear-gradient(90deg, ${BRAND} 0%, #5B86F0 100%)`,
                        opacity: 1 - i * 0.12,
                      }}
                    >
                      <span className="font-manrope text-[11px] font-bold text-white">
                        {f.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

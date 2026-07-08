import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const MANROPE = 'Manrope, sans-serif';
const chartTick = { fontSize: 11, fill: 'var(--color-grey)', fontFamily: MANROPE };

// Left-aligned Y-axis tick so labels line up with the card's title/subtitle edge
const yAxisTick = (formatter: (v: number) => string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ y, payload }: any) => (
    <text
      x={0}
      y={y}
      dy={3}
      textAnchor="start"
      fontSize={11}
      fill="var(--color-grey)"
      fontFamily={MANROPE}
    >
      {formatter(payload.value)}
    </text>
  );
const chartLegend = { fontSize: 11, fontFamily: MANROPE };
const chartTooltip = { fontSize: 12, borderRadius: 8, fontFamily: MANROPE };

// ---- Metric cards (minimal white + outline) ----
const metrics = [
  { label: 'Total campaigns', value: '50', sub: '6 channels' },
  { label: 'Total published', value: '1.12M', sub: 'Jun 8-19' },
  { label: 'Total delivered', value: '589K', sub: '~52.5% delivery rate' },
  { label: 'Total clicks', value: '5,016', sub: 'across all channels' },
  { label: 'Total conversions', value: '590', sub: 'all channels' },
  { label: 'Total revenue', value: '\u20B924.3L', sub: '\u20B924,27,222' },
];

// ---- Chart 1: Published vs Delivered by Channel ----
const publishedVsDelivered = [
  { channel: 'WhatsApp', Published: 510000, Delivered: 195000 },
  { channel: 'BPN', Published: 185000, Delivered: 98000 },
  { channel: 'RCS', Published: 152000, Delivered: 62000 },
  { channel: 'SMS', Published: 75000, Delivered: 40000 },
  { channel: 'Email', Published: 52000, Delivered: 52000 },
  { channel: 'APN', Published: 57000, Delivered: 47000 },
];

// ---- Chart 2: Click Rate & Conversion Rate by Channel ----
const ratesByChannel = [
  { channel: 'WhatsApp', 'Click rate %': 1.41, 'Conversion rate %': 0.25 },
  { channel: 'SMS', 'Click rate %': 1.25, 'Conversion rate %': 0.10 },
  { channel: 'APN', 'Click rate %': 1.04, 'Conversion rate %': 0.07 },
  { channel: 'Email', 'Click rate %': 0.97, 'Conversion rate %': 0.02 },
  { channel: 'BPN', 'Click rate %': 0.50, 'Conversion rate %': 0.00 },
  { channel: 'RCS', 'Click rate %': 0.42, 'Conversion rate %': 0.06 },
];

const formatThousands = (value: number) => {
  if (value >= 1000) return `${value / 1000}K`;
  return `${value}`;
};

// ---- Section building blocks ----
export const MetricCards: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-[8px] font-['Manrope']">
    {metrics.map((m) => (
      <div
        key={m.label}
        className="border border-[var(--color-line)] bg-card rounded-[8px] px-[12px] py-[10px] flex flex-col gap-[2px]"
      >
        <span className="text-[11px] text-[var(--color-grey)] font-medium">{m.label}</span>
        <span className="text-[20px] font-bold text-[var(--color-ink)] leading-tight">{m.value}</span>
        <span className="text-[10px] text-[var(--color-grey-soft)]">{m.sub}</span>
      </div>
    ))}
  </div>
);

export const PublishedVsDeliveredChart: React.FC = () => (
  <div className="w-full flex flex-col gap-[4px] font-['Manrope']">
    <p className="text-[12px] font-semibold text-[var(--color-ink)]">Published vs Delivered by Channel</p>
    <p className="text-[10px] text-[var(--color-grey)]">Volume comparison across channels</p>
    <div className="w-full h-[220px] mt-[8px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={publishedVsDelivered} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-2)" vertical={false} />
          <XAxis dataKey="channel" tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis width={38} tickFormatter={formatThousands} tick={yAxisTick(formatThousands)} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={chartTooltip} formatter={(value: number) => value.toLocaleString()} />
          <Legend wrapperStyle={chartLegend} />
          <Bar dataKey="Published" fill="var(--color-royal)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Delivered" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const RatesChart: React.FC = () => (
  <div className="w-full flex flex-col gap-[4px] font-['Manrope']">
    <p className="text-[12px] font-semibold text-[var(--color-ink)]">Click Rate & Conversion Rate by Channel</p>
    <p className="text-[10px] text-[var(--color-grey)]">Engagement efficiency across channels</p>
    <div className="w-full h-[220px] mt-[8px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ratesByChannel} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-2)" vertical={false} />
          <XAxis dataKey="channel" tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis width={38} tickFormatter={(v: number) => `${v}%`} tick={yAxisTick((v) => `${v}%`)} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={chartTooltip} formatter={(value: number) => `${value}%`} />
          <Legend wrapperStyle={chartLegend} />
          <Bar dataKey="Click rate %" fill="var(--color-royal)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Conversion rate %" fill="var(--color-warning)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ---- Skeleton building blocks ----
export const MetricCardsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-[8px]">
    {Array.from({ length: metrics.length }).map((_, i) => (
      <div
        key={i}
        className="border border-[var(--color-line)] bg-card rounded-[8px] px-[12px] py-[10px] flex flex-col gap-[6px]"
      >
        <Skeleton className="h-[10px] w-[60%]" />
        <Skeleton className="h-[18px] w-[40%]" />
        <Skeleton className="h-[8px] w-[70%]" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="w-full flex flex-col gap-[8px]">
    <Skeleton className="h-[12px] w-[45%]" />
    <Skeleton className="h-[8px] w-[30%]" />
    <Skeleton className="h-[220px] w-full mt-[8px]" />
  </div>
);

export const CampaignPerformanceDashboardSkeleton: React.FC = () => (
  <div className="w-full flex flex-col gap-[12px]">
    <MetricCardsSkeleton />
    <ChartSkeleton />
    <ChartSkeleton />
  </div>
);

type DashboardSection = 'all' | 'cards' | 'chart1' | 'chart2';

const CampaignPerformanceDashboard: React.FC<{ section?: DashboardSection }> = ({ section = 'all' }) => {
  if (section === 'cards') return <MetricCards />;
  if (section === 'chart1') return <PublishedVsDeliveredChart />;
  if (section === 'chart2') return <RatesChart />;
  return (
    <div className="w-full flex flex-col gap-[12px]">
      <MetricCards />
      <PublishedVsDeliveredChart />
      <RatesChart />
    </div>
  );
};

export default CampaignPerformanceDashboard;

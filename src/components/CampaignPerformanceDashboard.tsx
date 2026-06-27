import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const MANROPE = 'Manrope, sans-serif';
const chartTick = { fontSize: 11, fill: '#6F6F8D', fontFamily: MANROPE };
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
        className="border border-[#E5E7EB] bg-white rounded-[8px] px-[12px] py-[10px] flex flex-col gap-[2px]"
      >
        <span className="text-[11px] text-[#6F6F8D] font-medium">{m.label}</span>
        <span className="text-[20px] font-bold text-[#17173A] leading-tight">{m.value}</span>
        <span className="text-[10px] text-[#9AA3B2]">{m.sub}</span>
      </div>
    ))}
  </div>
);

export const PublishedVsDeliveredChart: React.FC = () => (
  <div className="w-full border border-[#E5E7EB] bg-white rounded-[8px] p-[12px] flex flex-col gap-[4px] font-['Manrope']">
    <p className="text-[12px] font-semibold text-[#17173A]">Published vs Delivered by Channel</p>
    <p className="text-[10px] text-[#6F6F8D]">Volume comparison across channels</p>
    <div className="w-full h-[220px] mt-[8px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={publishedVsDelivered} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF3" vertical={false} />
          <XAxis dataKey="channel" tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatThousands} tick={chartTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={chartTooltip} formatter={(value: number) => value.toLocaleString()} />
          <Legend wrapperStyle={chartLegend} />
          <Bar dataKey="Published" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Delivered" fill="#22A565" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const RatesChart: React.FC = () => (
  <div className="w-full border border-[#E5E7EB] bg-white rounded-[8px] p-[12px] flex flex-col gap-[4px] font-['Manrope']">
    <p className="text-[12px] font-semibold text-[#17173A]">Click Rate & Conversion Rate by Channel</p>
    <p className="text-[10px] text-[#6F6F8D]">Engagement efficiency across channels</p>
    <div className="w-full h-[220px] mt-[8px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ratesByChannel} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF3" vertical={false} />
          <XAxis dataKey="channel" tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v: number) => `${v}%`} tick={chartTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={chartTooltip} formatter={(value: number) => `${value}%`} />
          <Legend wrapperStyle={chartLegend} />
          <Bar dataKey="Click rate %" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Conversion rate %" fill="#E0A82E" radius={[3, 3, 0, 0]} />
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
        className="border border-[#E5E7EB] bg-white rounded-[8px] px-[12px] py-[10px] flex flex-col gap-[6px]"
      >
        <Skeleton className="h-[10px] w-[60%]" />
        <Skeleton className="h-[18px] w-[40%]" />
        <Skeleton className="h-[8px] w-[70%]" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="w-full border border-[#E5E7EB] bg-white rounded-[8px] p-[12px] flex flex-col gap-[8px]">
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

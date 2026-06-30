import React from 'react';
import { PanelRightClose, Download, ArrowLeftToLine, ArrowRightToLine, ArrowLeft } from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MANROPE = 'Manrope, sans-serif';
const chartTick = { fontSize: 11, fill: 'var(--color-grey)', fontFamily: MANROPE };
const chartLegend = { fontSize: 11, fontFamily: MANROPE };
const chartTooltip = { fontSize: 12, borderRadius: 8, fontFamily: MANROPE };

interface ArtifactPreviewProps {
  fileName?: string;
  title?: string;
  onClose?: () => void;        // collapse/close the artifact panel
  onDownload?: () => void;
  isFullExpanded?: boolean;    // artifact occupies full width (chat hidden)
  onToggleExpand?: () => void; // expand to full / restore split (omit to hide the toggle)
  bare?: boolean;              // drop the outer card border/radius (full-bleed, e.g. widget view)
}

// ---- KPI cards ----
const kpis = [
  { label: 'CUSTOMERS ANALYSED', value: '23M', sub: 'every single one' },
  { label: 'SIGNALS READ', value: '469M', sub: 'across every interaction' },
  { label: 'CUSTOMER TYPES FOUND', value: '29', sub: 'discovered automatically' },
  { label: 'TARGETING BOOST', value: '4.87x', sub: 'more first-time buyers, same spend' },
  { label: 'READY-TO-ACT CUSTOMERS', value: '8.7M', sub: 'with a clear next step' },
  { label: 'SAFE TO MESSAGE NOW', value: '7.6M', sub: '99.0% — brand-safe' },
];

// ---- Gauge (donut with center value) ----
const Gauge: React.FC<{ value: number; color: string; title: string; sub: string }> = ({ value, color, title, sub }) => {
  const data = [{ v: value }, { v: 1 - value }];
  return (
    <div className="flex flex-col items-center gap-[6px]">
      <div className="relative w-[96px] h-[96px]">
        <PieChart width={96} height={96}>
          <Pie
            data={data}
            dataKey="v"
            innerRadius={36}
            outerRadius={46}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="var(--color-surface-2)" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-bold text-[var(--color-ink)]">{value.toFixed(2)}</span>
          <span className="text-[8px] text-[var(--color-grey)] tracking-wide">ACCURACY</span>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-[var(--color-ink)] text-center">{title}</p>
      <p className="text-[10px] text-[var(--color-grey)] text-center">{sub}</p>
    </div>
  );
};

// ---- Channel donut ----
const channelData = [
  { name: 'On-site / in-app', value: 88.3, count: '2,06,85,743', color: 'var(--color-orange)' },
  { name: 'Email', value: 6, count: '14,86,303', color: 'var(--color-royal)' },
  { name: 'WhatsApp', value: 5.7, count: '13,35,988', color: 'var(--color-success)' },
];

// ---- Bottom bar chart ----
const barData = [
  { name: 'Email', CTR: 0.54, 'Open Rate': 78.1, 'Conversion Rate': 0.4 },
  { name: 'WhatsApp', CTR: 20.8, 'Open Rate': 64.2, 'Conversion Rate': 3.1 },
  { name: 'APN', CTR: 4.2, 'Open Rate': 41.6, 'Conversion Rate': 1.2 },
  { name: 'SMS', CTR: 2.1, 'Open Rate': 33.0, 'Conversion Rate': 0.8 },
];

const tableRows = [
  { q: 'Jul 2025', conv: '1,249', rev: '935,654', ctr: '0.54%', open: '78.17%', cr: '0.0%' },
  { q: 'Aug 2025', conv: '1,249', rev: '935,654', ctr: '0.54%', open: '78.17%', cr: '0.0%' },
];

// ---- Campaign performance table (minimal, scrolls horizontally when narrow) ----
const campaignCols = ['Campaign', 'Date', 'Published', 'Sent', 'Delivered', 'Delivery %', 'Read', 'Read %'] as const;
const campaignRows = [
  { name: 'custom only2 19th june26',                   date: 'Jun 19', published: '14,188', sent: '14,188', delivered: '7,482', delivery: '52.7%', read: '3,765', readPct: '50.3%' },
  { name: 'custom only2 19th june26 part2',             date: 'Jun 19', published: '14,432', sent: '14,432', delivered: '8,177', delivery: '56.7%', read: '5,174', readPct: '63.3%' },
  { name: 'custom data 19th june 26',                   date: 'Jun 19', published: '47,746', sent: '42,638', delivered: '8,119', delivery: '19.0%', read: '3,108', readPct: '38.3%' },
  { name: 'App users pop sale extented 19th june26',    date: 'Jun 19', published: '23,712', sent: '23,712', delivered: '6,142', delivery: '25.9%', read: '3,492', readPct: '56.9%' },
  { name: 'restock dolchi cross sell ghee 18th june26', date: 'Jun 18', published: '4,297',  sent: '4,297',  delivered: '2,665', delivery: '62.0%', read: '1,284', readPct: '48.2%' },
  { name: 'likely to click 18th june26',                date: 'Jun 18', published: '10,046', sent: '10,046', delivered: '7,179', delivery: '71.5%', read: '3,639', readPct: '50.7%' },
  { name: 'wa preferred weknd weekday 18th june26',     date: 'Jun 18', published: '7,698',  sent: '7,698',  delivered: '3,880', delivery: '50.4%', read: '1,835', readPct: '47.3%' },
];
const campaignTotals = { published: '3,54,774', sent: '3,49,666', delivered: '1,80,572', delivery: '50.9%', read: '91,405' };

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({
  fileName = 'Ui launch usage readout combined · PDF',
  title = 'Highest Engagement Last Quarter',
  onClose,
  onDownload,
  isFullExpanded = false,
  onToggleExpand,
  bare = false,
}) => {
  return (
    <div className={`flex flex-col h-full w-full bg-white overflow-hidden${bare ? '' : ' border border-[var(--color-line-input)] rounded-[12px]'}`}>
      {/* top-nav-artifact */}
      <TooltipProvider delayDuration={200}>
        <div className="flex gap-[8px] items-center px-[8px] py-[4px] w-full shrink-0 border-b border-[var(--color-line-input)]">
          {/* Left cluster: 1) expand arrow  2) collapse/close  then label */}
          <div className="flex min-w-0 gap-[4px] items-center">
            {onToggleExpand && (
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors shrink-0"
                  aria-label={isFullExpanded ? 'Restore split view' : 'Expand artifact'}
                >
                  {isFullExpanded
                    ? <ArrowRightToLine className="size-[16px] text-[var(--color-slate)]" />
                    : <ArrowLeftToLine className="size-[16px] text-[var(--color-slate)]" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0 bg-[var(--color-ink)] text-white text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: MANROPE, fontWeight: 500 }}>
                <p>{isFullExpanded ? 'Restore split view' : 'Expand artifact'}</p>
              </TooltipContent>
            </UITooltip>
            )}
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors shrink-0"
                  aria-label="Close artifact"
                >
                  {bare
                    ? <ArrowLeft className="size-[16px] text-[var(--color-slate)]" />
                    : <PanelRightClose className="size-[16px] text-[var(--color-slate)]" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0 bg-[var(--color-ink)] text-white text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: MANROPE, fontWeight: 500 }}>
                <p>Close artifact</p>
              </TooltipContent>
            </UITooltip>
            <p className="min-w-0 truncate text-[14px] font-medium text-black">
              {fileName}
            </p>
          </div>
          {/* Spacer */}
          <div className="flex-1" />
          {/* Right: download */}
          <UITooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onDownload}
                className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors shrink-0"
                aria-label="Download artifact"
              >
                <Download className="size-[16px] text-[var(--color-slate)]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="border-0 bg-[var(--color-ink)] text-white text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: MANROPE, fontWeight: 500 }}>
              <p>Download document</p>
            </TooltipContent>
          </UITooltip>
        </div>
      </TooltipProvider>

      {/* content-area (scrollable) */}
      <div className="flex flex-col gap-[16px] items-start px-[16px] py-[16px] w-full flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <p className="text-[20px] font-semibold leading-[28px] text-[var(--color-ink)] w-full">
          {title}
        </p>

        {/* Top dashboard section — no outer box; the tiles and chart blocks carry their own borders */}
        <div className="w-full flex flex-col gap-[16px]">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-[8px]">
            {kpis.map((k) => (
              <div key={k.label} className="border border-[var(--color-surface-2)] rounded-[8px] px-[10px] py-[8px] flex flex-col gap-[2px]">
                <span className="text-[8px] tracking-[0.5px] text-[var(--color-grey-soft)] font-medium">{k.label}</span>
                <span className="text-[18px] font-bold text-[var(--color-ink)] leading-none">{k.value}</span>
                <span className="text-[9px] text-[var(--color-grey)]">{k.sub}</span>
              </div>
            ))}
          </div>

          {/* Charts row — stacks based on available panel width, not viewport */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-[12px]">
            {/* Gauges block */}
            <div className="border border-[var(--color-surface-2)] rounded-[8px] p-[12px] flex flex-col gap-[8px] min-w-0">
              <p className="text-[11px] font-semibold text-[var(--color-ink)]">Who's about to act</p>
              <p className="text-[9px] text-[var(--color-grey)]">How confidently we can pick the right people — and the payoff</p>
              <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-4 pt-[4px]">
                <Gauge value={0.83} color="var(--color-success)" title="First-time buyers" sub="6.87x better targeting · 8.2M ranked" />
                <Gauge value={0.71} color="var(--color-warning)" title="Repeat buyers" sub="2.62x better targeting · 535K ranked" />
              </div>
            </div>

            {/* Channel donut block */}
            <div className="border border-[var(--color-surface-2)] rounded-[8px] p-[12px] flex flex-col gap-[8px] min-w-0">
              <p className="text-[11px] font-semibold text-[var(--color-ink)]">Where they actually engage</p>
              <p className="text-[9px] text-[var(--color-grey)]">We route each person to the channel they respond to</p>
              <div className="flex flex-wrap items-center justify-center gap-[12px] pt-[4px]">
                <div className="relative w-[96px] h-[96px] shrink-0">
                  <PieChart width={96} height={96}>
                    <Pie data={channelData} dataKey="value" innerRadius={32} outerRadius={46} stroke="none">
                      {channelData.map((c) => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-bold text-[var(--color-ink)]">25.67%</span>
                    <span className="text-[8px] text-[var(--color-grey)]">SHARED</span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px] flex-1 min-w-[160px]">
                  {channelData.map((c) => (
                    <div key={c.name} className="flex items-center gap-[4px] text-[9px]">
                      <span className="size-[8px] rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-[var(--color-grey)] flex-1 min-w-0">{c.name}</span>
                      <span className="text-[var(--color-ink)] font-medium shrink-0">{c.count}</span>
                      <span className="text-[var(--color-grey)] shrink-0">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="flex flex-col gap-[8px] w-full">
          <p className="text-[16px] font-semibold leading-[24px] text-[var(--color-ink)]">⭐ Executive Summary</p>
          <p className="text-[14px] leading-[24px] text-[var(--color-ink)]">
            The performance analysis <strong>(Aug 17–Nov 17, 2025)</strong> highlights strong differences between Q3 and Q4. Q3 delivered significantly higher conversions <strong>(1,249)</strong>{' '}
            <span className="bg-[var(--color-surface-1)] text-[var(--color-grey)] text-[12px] rounded-[6px] px-[6px] py-[2px]">whatsAppCampaign +1</span>{' '}
            and revenue <strong>(935,654 units)</strong> compared to Q4 <strong>(648 conversions, 786,660 units).</strong>
          </p>
          <p className="text-[14px] leading-[24px] text-[var(--color-ink)]">
            <strong>WhatsApp</strong> was the standout channel, especially in Q3, generating the <strong>highest revenue (389,886 units)</strong>,{' '}
            <span className="bg-[var(--color-surface-1)] text-[var(--color-grey)] text-[12px] rounded-[6px] px-[6px] py-[2px]">augcampaign +1</span>{' '}
            <strong>highest conversions (569)</strong>, and an <strong>impressive 20.8% CTR.</strong>
          </p>
        </div>

        {/* Table */}
        <div className="w-full border border-[var(--color-line)] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  {['Quarter', 'Total Conversion', 'Total Revenue (₹)', 'CTR', 'Open Rate', 'Conversion Rate'].map((h) => (
                    <th key={h} className="text-left font-medium text-[var(--color-grey)] px-[10px] py-[10px] whitespace-nowrap tracking-[0.33px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={i} className="bg-white border-t border-[var(--color-line)]">
                    <td className="px-[10px] py-[10px] text-[var(--color-ink)] font-medium whitespace-nowrap">{r.q}</td>
                    <td className="px-[10px] py-[10px] text-[var(--color-ink)] whitespace-nowrap">{r.conv}</td>
                    <td className="px-[10px] py-[10px] text-[var(--color-ink)] font-medium whitespace-nowrap">{r.rev}</td>
                    <td className="px-[10px] py-[10px] text-[var(--color-ink)] whitespace-nowrap">{r.ctr}</td>
                    <td className="px-[10px] py-[10px] text-[var(--color-ink)] whitespace-nowrap">{r.open}</td>
                    <td className="px-[10px] py-[10px] text-[var(--color-ink)] whitespace-nowrap">{r.cr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaign performance table — minimal; scrolls horizontally on narrow widths */}
        <div className="w-full flex flex-col gap-[4px]">
          <p className="text-[12px] font-semibold text-[var(--color-ink)]">Campaign performance</p>
          <p className="text-[10px] text-[var(--color-grey)]">Delivery and read rates by campaign</p>
          <div className="w-full border border-[var(--color-line)] rounded-[8px] overflow-hidden mt-[4px]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[var(--color-surface-2)]">
                    {campaignCols.map((h, i) => (
                      <th
                        key={h}
                        className={`font-medium text-[var(--color-grey)] px-[10px] py-[8px] whitespace-nowrap tracking-[0.33px] ${i === 0 ? 'text-left' : 'text-right'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.map((r, i) => (
                    <tr key={i} className="bg-white border-t border-[var(--color-line)]">
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-medium whitespace-nowrap">{r.name}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-grey)] whitespace-nowrap text-right">{r.date}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] whitespace-nowrap text-right">{r.published}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] whitespace-nowrap text-right">{r.sent}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] whitespace-nowrap text-right">{r.delivered}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] whitespace-nowrap text-right">{r.delivery}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] whitespace-nowrap text-right">{r.read}</td>
                      <td className="px-[10px] py-[8px] text-[var(--color-ink)] whitespace-nowrap text-right">{r.readPct}</td>
                    </tr>
                  ))}
                  <tr className="bg-white border-t border-[var(--color-line)]">
                    <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-semibold whitespace-nowrap">Totals (23 campaigns)</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-grey)] whitespace-nowrap text-right">—</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-semibold whitespace-nowrap text-right">{campaignTotals.published}</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-semibold whitespace-nowrap text-right">{campaignTotals.sent}</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-semibold whitespace-nowrap text-right">{campaignTotals.delivered}</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-semibold whitespace-nowrap text-right">{campaignTotals.delivery}</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-ink)] font-semibold whitespace-nowrap text-right">{campaignTotals.read}</td>
                    <td className="px-[10px] py-[8px] text-[var(--color-grey)] whitespace-nowrap text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom bar chart */}
        <div className="w-full border border-[var(--color-line)] rounded-[8px] p-[12px] flex flex-col gap-[4px]">
          <p className="text-[12px] font-semibold text-[var(--color-ink)]">Q1 Performance Metrics Comparison</p>
          <p className="text-[10px] text-[var(--color-grey)]">CTR, Open Rate, and Conversion Rate Analysis</p>
          <div className="w-full h-[220px] mt-[8px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-2)" vertical={false} />
                <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltip} />
                <Legend wrapperStyle={chartLegend} />
                <Bar dataKey="CTR" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Open Rate" fill="var(--color-royal)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Conversion Rate" fill="var(--color-warning)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactPreview;

import { useMemo, useState } from 'react';
import type { BriefingItem, Message } from '../types';

interface GapStripProps {
  chatSpan: { from: number; to: number };
  slice: { from: number; to: number };
  items: BriefingItem[];
  allMessages: Message[];
  onSelectPin: (item: BriefingItem) => void;
}

const BUCKET_COUNT = 80;

function formatDayTick(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTooltipTime(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export function GapStrip({
  chatSpan,
  slice,
  items,
  allMessages,
  onSelectPin,
}: GapStripProps) {
  const [activeTooltipItem, setActiveTooltipItem] = useState<BriefingItem | null>(null);

  const totalSpanMs = Math.max(1, chatSpan.to - chatSpan.from);
  const bucketDuration = totalSpanMs / BUCKET_COUNT;

  // Compute message density buckets
  const { buckets, maxCount } = useMemo(() => {
    const counts = new Array(BUCKET_COUNT).fill(0);

    for (const m of allMessages) {
      const idx = Math.min(
        BUCKET_COUNT - 1,
        Math.max(0, Math.floor((m.ts - chatSpan.from) / bucketDuration))
      );
      counts[idx]++;
    }

    const max = Math.max(1, ...counts);
    const result = counts.map((count, i) => {
      const bucketStart = chatSpan.from + i * bucketDuration;
      const isUnread = bucketStart + bucketDuration >= slice.from;
      return { count, isUnread };
    });

    return { buckets: result, maxCount: max };
  }, [allMessages, chatSpan, slice, bucketDuration]);

  // Unread slice percentage coordinates
  const sliceStartPct = Math.max(0, Math.min(100, ((slice.from - chatSpan.from) / totalSpanMs) * 100));
  const sliceWidthPct = Math.max(2, 100 - sliceStartPct);

  // Day tick boundaries
  const dayTicks = useMemo(() => {
    const ticks: { label: string; pct: number }[] = [];
    let cur = new Date(chatSpan.from);
    cur.setHours(0, 0, 0, 0);

    // If start is midway through day, advance to midnight
    if (cur.getTime() < chatSpan.from) {
      cur = new Date(cur.getTime() + 24 * 3600 * 1000);
    }

    while (cur.getTime() <= chatSpan.to) {
      const pct = ((cur.getTime() - chatSpan.from) / totalSpanMs) * 100;
      if (pct >= 0 && pct <= 100) {
        ticks.push({ label: formatDayTick(cur.getTime()), pct });
      }
      cur = new Date(cur.getTime() + 24 * 3600 * 1000);
    }

    return ticks;
  }, [chatSpan, totalSpanMs]);

  // Message mapping for timestamp retrieval
  const msgMap = useMemo(() => new Map(allMessages.map((m) => [m.id, m])), [allMessages]);

  const getItemTimestamp = (item: BriefingItem) => {
    const msg = msgMap.get(item.sourceMessageIds[0]);
    return msg ? msg.ts : slice.from;
  };

  const getPinColor = (kind: BriefingItem['kind']) => {
    switch (kind) {
      case 'needs_you':
        return 'bg-red-500 border-red-700 shadow-red-500/30';
      case 'deadline':
        return 'bg-amber-500 border-amber-700 shadow-amber-500/30';
      case 'decision':
        return 'bg-sky-600 border-sky-800 shadow-sky-600/30';
      default:
        return 'bg-zinc-600 border-zinc-800 shadow-zinc-600/30';
    }
  };

  return (
    <div
      role="group"
      aria-label="Chat activity minimap with unread timeline and action pins"
      className="card p-4 sm:p-5 bg-white border border-zinc-200 shadow-xs w-full mb-6 relative select-none"
    >
      {/* Screen-reader accessible alternative list */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.id}>
            {item.kind}: {item.title} ({formatTooltipTime(getItemTimestamp(item))})
          </li>
        ))}
      </ul>

      {/* Top Header / Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-900">Activity Timeline</span>
          <span className="text-[11px] text-zinc-400">
            ({BUCKET_COUNT} time buckets across {allMessages.length} messages)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-600 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-zinc-300" />
            <span>Read</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-zinc-800" />
            <span>Unread</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Needs you</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Deadline</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
            <span>Decision</span>
          </span>
        </div>
      </div>

      {/* Main Density Minimap Strip */}
      <div className="relative pt-6 pb-2">
        {/* Unread Away Band Highlight */}
        <div
          style={{ left: `${sliceStartPct}%`, width: `${sliceWidthPct}%` }}
          className="absolute top-0 bottom-2 bg-amber-50/80 border-l border-amber-300/80 rounded-r-lg pointer-events-none transition-all z-0"
        >
          <span className="absolute -top-4 left-1 text-[10px] font-bold text-amber-800 tracking-tight bg-amber-100 px-1.5 py-0.5 rounded shadow-2xs">
            you were away
          </span>
        </div>

        {/* Bars Container */}
        <div className="relative z-10 flex items-end gap-[1.5px] h-12 w-full">
          {buckets.map((b, i) => {
            const heightPx = Math.max(3, Math.round((b.count / maxCount) * 44));
            return (
              <div
                key={i}
                style={{ height: `${heightPx}px` }}
                className={`flex-1 rounded-t-[1px] transition-colors ${
                  b.isUnread ? 'bg-zinc-800' : 'bg-zinc-300'
                }`}
                title={`${b.count} messages`}
              />
            );
          })}
        </div>

        {/* Action Item Pins */}
        <div className="absolute inset-x-0 top-3 h-12 pointer-events-none z-20">
          {items.map((item) => {
            const itemTs = getItemTimestamp(item);
            const leftPct = Math.max(1, Math.min(99, ((itemTs - chatSpan.from) / totalSpanMs) * 100));
            const formattedDate = formatTooltipTime(itemTs);
            const isHovered = activeTooltipItem?.id === item.id;

            return (
              <div
                key={item.id}
                style={{ left: `${leftPct}%` }}
                className="absolute top-2 -translate-x-1/2 pointer-events-auto"
              >
                {/* 44px Accessible Click Area Button */}
                <button
                  type="button"
                  onClick={() => onSelectPin(item)}
                  onMouseEnter={() => setActiveTooltipItem(item)}
                  onMouseLeave={() => setActiveTooltipItem(null)}
                  onFocus={() => setActiveTooltipItem(item)}
                  onBlur={() => setActiveTooltipItem(null)}
                  aria-label={`${item.kind.replace('_', ' ')}: ${item.title}, ${formattedDate}`}
                  className="w-7 h-7 -m-1 flex items-center justify-center cursor-pointer group focus-visible:outline-2 focus-visible:outline-orange-500 rounded-full"
                >
                  <span
                    className={`w-3 h-3 rounded-full border-2 transition-transform duration-150 group-hover:scale-125 shadow-xs ${getPinColor(
                      item.kind
                    )}`}
                  />
                </button>

                {/* Accessible Hover/Focus Tooltip */}
                {isHovered && (
                  <div
                    role="tooltip"
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-zinc-900 text-white text-[11px] shadow-xl z-30 pointer-events-none text-center"
                  >
                    <div className="font-semibold truncate text-zinc-100">{item.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formattedDate}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Ticks Underneath */}
      <div className="relative h-4 mt-1 border-t border-zinc-100 text-[10px] text-zinc-400 font-mono">
        {dayTicks.map((tick, i) => (
          <span
            key={i}
            style={{ left: `${tick.pct}%` }}
            className="absolute top-1 -translate-x-1/2 whitespace-nowrap"
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}

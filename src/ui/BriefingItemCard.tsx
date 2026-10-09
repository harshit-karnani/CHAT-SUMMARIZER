import { Calendar, UserCheck, Clock, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import type { BriefingItem, Message } from '../types';
import { downloadIcs } from '../core/ics';

interface BriefingItemCardProps {
  item: BriefingItem;
  strongestMessage?: Message;
  onOpenContext: (messageId: number) => void;
  isHighlighted?: boolean;
}

function getSenderInitials(name: string): string {
  if (!name || name === 'system') return 'SY';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatItemTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

export function BriefingItemCard({
  item,
  strongestMessage,
  onOpenContext,
  isHighlighted = false,
}: BriefingItemCardProps) {
  const senderName = strongestMessage?.sender || 'Unknown';
  const initials = getSenderInitials(senderName);
  const primaryMsgId = item.sourceMessageIds[0] ?? 1;

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcs(item);
  };

  const getKindBadge = () => {
    switch (item.kind) {
      case 'needs_you':
        return (
          <span className="badge badge-needs-you">
            <UserCheck className="w-3 h-3 text-red-700" />
            <span>Needs you</span>
          </span>
        );
      case 'deadline':
        return (
          <span className="badge badge-deadline">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Deadline</span>
          </span>
        );
      case 'decision':
        return (
          <span className="badge badge-decision">
            <CheckCircle2 className="w-3 h-3 text-sky-700" />
            <span>Decision</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-fyi">
            <Info className="w-3 h-3 text-zinc-700" />
            <span>FYI</span>
          </span>
        );
    }
  };

  return (
    <article
      id={`briefing-card-${item.id}`}
      onClick={() => onOpenContext(primaryMsgId)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenContext(primaryMsgId);
        }
      }}
      aria-label={`${item.title}. Press Enter to view message context.`}
      className={`card p-4 sm:p-5 bg-white transition-all cursor-pointer hover:border-zinc-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-orange-500 ${
        isHighlighted ? 'ring-2 ring-orange-500 border-orange-400' : ''
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {getKindBadge()}
          <span className="msg-ref font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px] text-zinc-600">
            #msg-{primaryMsgId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {item.dueAt && (
            <button
              type="button"
              onClick={handleCalendarClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
              title="Export event as .ics calendar file"
            >
              <Calendar className="w-3 h-3 text-amber-700" />
              <span>+ Add to Calendar</span>
            </button>
          )}
          <span className="text-[11px] text-zinc-400 font-mono">
            {strongestMessage ? formatItemTime(strongestMessage.ts) : ''}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug mb-1.5 group-hover:text-orange-950">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-3">
        {item.summary}
      </p>

      {/* Bottom Footer: Sender initials + Reasons */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100/80 text-xs">
        <div className="flex items-center gap-2 text-zinc-500">
          <div
            className="w-5 h-5 rounded-full bg-zinc-200 border border-zinc-300/80 text-zinc-800 text-[10px] font-bold flex items-center justify-center shrink-0"
            title={senderName}
          >
            {initials}
          </div>
          <span className="font-medium text-zinc-700 truncate max-w-[120px] sm:max-w-none">
            {senderName}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="text-[11px] text-zinc-500 truncate max-w-[200px] sm:max-w-md">
            {item.reason}
          </span>
        </div>

        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-zinc-400 hover:text-orange-600 transition-colors shrink-0">
          <span>Inspect</span>
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </article>
  );
}

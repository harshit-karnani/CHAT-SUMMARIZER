import { Calendar, UserCheck, Clock, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import type { BriefingItem, Message } from '../types';
import { downloadIcs, makeGoogleCalendarUrl } from '../core/ics';

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

  const handleGoogleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = makeGoogleCalendarUrl(item);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getAccentBorderClass = () => {
    switch (item.kind) {
      case 'needs_you':
        return 'border-l-4 border-l-rose-500';
      case 'deadline':
        return 'border-l-4 border-l-amber-500';
      case 'decision':
        return 'border-l-4 border-l-emerald-500';
      default:
        return 'border-l-4 border-l-zinc-400';
    }
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
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
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
      className={`bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 relative overflow-hidden transition-all cursor-pointer hover:border-zinc-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-orange-500 ${getAccentBorderClass()} ${
        isHighlighted ? 'ring-2 ring-orange-500 border-orange-400' : ''
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {getKindBadge()}
          <span className="font-mono bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded text-[11px] text-zinc-600 border border-zinc-200/60 transition-colors">
            #msg-{primaryMsgId}
          </span>
          {item.kind === 'needs_you' && (item.signals.includes('direct_question') || item.title.includes('?')) && (
            <span className="inline-flex items-center text-[10px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 px-1.5 py-0.5 rounded">
              Direct Question
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.dueAt && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center justify-center px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[10px] leading-tight">
                <span className="font-bold uppercase text-[9px] text-amber-700">
                  {new Date(item.dueAt).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="font-extrabold text-xs leading-none">
                  {new Date(item.dueAt).getDate()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGoogleCalendarClick}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs"
                  title="Add directly to Google Calendar in 1-click"
                >
                  <Calendar className="w-3 h-3 text-orange-600" />
                  <span>Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={handleCalendarClick}
                  className="btn-secondary text-[11px] py-1 px-2 font-semibold"
                  title="Export event as .ics file (Apple / Outlook)"
                >
                  <span>.ics</span>
                </button>
              </div>
            </div>
          )}
          <span className="text-[11px] text-zinc-400 font-mono">
            {strongestMessage ? formatItemTime(strongestMessage.ts) : ''}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-1.5">
        {item.kind === 'needs_you' && (item.signals.includes('direct_question') || item.title.includes('?')) ? (
          <h3 className="text-sm sm:text-base font-sans font-bold text-zinc-900 leading-snug">
            <code className="text-xs sm:text-sm font-mono font-semibold bg-rose-50/70 text-rose-900 border border-rose-200/70 px-1.5 py-0.5 rounded">
              {item.title}
            </code>
          </h3>
        ) : (
          <h3 className="text-sm sm:text-base font-sans font-bold text-zinc-900 leading-snug">
            {item.title}
          </h3>
        )}
      </div>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-zinc-600 font-sans leading-relaxed mb-3">
        {item.summary}
      </p>

      {/* Bottom Footer: Sender initials + Reasons */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-xs">
        <div className="flex items-center gap-2 text-zinc-500">
          <div
            className="w-5 h-5 rounded-full bg-zinc-200 border border-zinc-300/80 text-zinc-800 text-[10px] font-bold flex items-center justify-center shrink-0 font-mono"
            title={senderName}
          >
            {initials}
          </div>
          <span className="font-sans font-bold text-zinc-800 truncate max-w-[120px] sm:max-w-none">
            {senderName}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="text-[11px] text-zinc-500 truncate max-w-[200px] sm:max-w-md font-sans">
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

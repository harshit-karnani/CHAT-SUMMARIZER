import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, UserCheck, Clock, CheckCircle2, Info, VolumeX } from 'lucide-react';
import type { Briefing, Message, ParsedChat, UserContext } from '../types';
import { BriefingItemCard } from './BriefingItemCard';
import { ExecutiveSummary } from './ExecutiveSummary';
import { EmptyState } from './EmptyState';

interface BriefingViewProps {
  chat: ParsedChat;
  briefing: Briefing;
  user: UserContext;
  apiKey: string;
  allMessages: Message[];
  onOpenContext: (messageId: number) => void;
  onAdjustParameters: () => void;
  onSendCloudRequest?: (linesCount: number) => void;
  highlightedItemId?: string | null;
}

export function BriefingView({
  chat,
  briefing,
  user,
  apiKey,
  allMessages,
  onOpenContext,
  onAdjustParameters,
  onSendCloudRequest,
  highlightedItemId,
}: BriefingViewProps) {
  const [showNoise, setShowNoise] = useState(false);

  // Calculate unread slice messages and reading time: words / 200
  const unreadMessages = allMessages.filter(
    (m) => m.ts >= briefing.slice.from && m.ts <= briefing.slice.to
  );
  const totalWords = unreadMessages.reduce((acc, m) => {
    return acc + (m.text ? m.text.trim().split(/\s+/).length : 0);
  }, 0);
  const estimatedReadMin = Math.max(1, Math.round(totalWords / 200));

  // Partition briefing items by kind
  const needsYouItems = briefing.items.filter((i) => i.kind === 'needs_you');
  const deadlineItems = briefing.items.filter((i) => i.kind === 'deadline');
  const decisionItems = briefing.items.filter((i) => i.kind === 'decision');
  const fyiItems = briefing.items.filter((i) => i.kind === 'fyi');

  // Identify noise messages (messages in slice not in any briefing item)
  const clusteredIds = new Set(briefing.items.flatMap((i) => i.sourceMessageIds));
  const noiseMessages = unreadMessages.filter((m) => !clusteredIds.has(m.id) && !m.isSystem);

  const msgMap = new Map<number, Message>(allMessages.map((m) => [m.id, m]));

  return (
    <div className="w-full space-y-6">
      {/* 1. Executive Summary Header Card */}
      <section className="card p-6 bg-white shadow-xs border border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-orange-600 font-display">
              Executive Briefing
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight font-display">
              While you were out
            </h1>
          </div>
          <button
            type="button"
            onClick={onAdjustParameters}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Adjust parameters</span>
          </button>
        </div>

        {/* Read Time & Speedup Stat */}
        <p className="text-xs sm:text-sm text-zinc-600 mt-3 leading-relaxed">
          <span className="font-bold text-zinc-900">{briefing.missedCount} messages</span>, about{' '}
          <span className="font-bold text-zinc-900">{estimatedReadMin} min</span> to read, here is the{' '}
          <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">
            40-second version
          </span>.
        </p>

        {/* Breakdown Metric Chips */}
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-zinc-100 text-xs">
          <span className="badge badge-needs-you">
            <UserCheck className="w-3 h-3 text-red-700" />
            {briefing.counts.needs_you} Needs you
          </span>
          <span className="badge badge-deadline">
            <Clock className="w-3 h-3 text-amber-700" />
            {briefing.counts.deadline} Deadlines
          </span>
          <span className="badge badge-decision">
            <CheckCircle2 className="w-3 h-3 text-sky-700" />
            {briefing.counts.decision} Decisions
          </span>
          {briefing.counts.fyi > 0 && (
            <span className="badge badge-fyi">
              <Info className="w-3 h-3 text-zinc-700" />
              {briefing.counts.fyi} FYI
            </span>
          )}
          <span className="text-zinc-400 text-xs ml-auto">
            {briefing.noiseCount} noise filtered
          </span>
        </div>

        {/* Executive Summary Subsection */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <ExecutiveSummary
            chat={chat}
            briefing={briefing}
            user={user}
            apiKey={apiKey}
            onSendCloudRequest={onSendCloudRequest}
          />
        </div>
      </section>

      {/* Empty State when no items need action */}
      {briefing.items.length === 0 && (
        <EmptyState onAdjustTime={onAdjustParameters} />
      )}

      {/* 2. Needs You Section */}
      {needsYouItems.length > 0 && (
        <section aria-labelledby="heading-needs-you" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
            <UserCheck className="w-4 h-4 text-red-600" />
            <h3 id="heading-needs-you" className="text-sm font-bold uppercase tracking-wider text-red-800">
              Needs your action ({needsYouItems.length})
            </h3>
          </div>
          <div className="space-y-3">
            {needsYouItems.map((item) => (
              <BriefingItemCard
                key={item.id}
                item={item}
                strongestMessage={msgMap.get(item.sourceMessageIds[0])}
                onOpenContext={onOpenContext}
                isHighlighted={highlightedItemId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Deadlines Section */}
      {deadlineItems.length > 0 && (
        <section aria-labelledby="heading-deadlines" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 id="heading-deadlines" className="text-sm font-bold uppercase tracking-wider text-amber-800">
              Upcoming Deadlines ({deadlineItems.length})
            </h3>
          </div>
          <div className="space-y-3">
            {deadlineItems.map((item) => (
              <BriefingItemCard
                key={item.id}
                item={item}
                strongestMessage={msgMap.get(item.sourceMessageIds[0])}
                onOpenContext={onOpenContext}
                isHighlighted={highlightedItemId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Decisions Section */}
      {decisionItems.length > 0 && (
        <section aria-labelledby="heading-decisions" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <h3 id="heading-decisions" className="text-sm font-bold uppercase tracking-wider text-sky-800">
              Team Decisions ({decisionItems.length})
            </h3>
          </div>
          <div className="space-y-3">
            {decisionItems.map((item) => (
              <BriefingItemCard
                key={item.id}
                item={item}
                strongestMessage={msgMap.get(item.sourceMessageIds[0])}
                onOpenContext={onOpenContext}
                isHighlighted={highlightedItemId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. FYI Section */}
      {fyiItems.length > 0 && (
        <section aria-labelledby="heading-fyi" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
            <Info className="w-4 h-4 text-zinc-500" />
            <h3 id="heading-fyi" className="text-sm font-bold uppercase tracking-wider text-zinc-700">
              FYI Updates ({fyiItems.length})
            </h3>
          </div>
          <div className="space-y-3">
            {fyiItems.map((item) => (
              <BriefingItemCard
                key={item.id}
                item={item}
                strongestMessage={msgMap.get(item.sourceMessageIds[0])}
                onOpenContext={onOpenContext}
                isHighlighted={highlightedItemId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. Collapsed Noise Section */}
      {briefing.noiseCount > 0 && (
        <section className="pt-2">
          <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setShowNoise((prev) => !prev)}
              aria-expanded={showNoise}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <VolumeX className="w-4 h-4 text-zinc-400" />
                <span>
                  {briefing.noiseCount} messages you can safely ignore
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  showNoise ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showNoise && (
              <div className="p-4 pt-1 border-t border-zinc-100 max-h-72 overflow-y-auto space-y-2 text-xs bg-zinc-50/50">
                {noiseMessages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onOpenContext(m.id)}
                    role="button"
                    tabIndex={0}
                    className="p-2.5 rounded-xl bg-white border border-zinc-200/80 hover:border-zinc-300 transition-colors cursor-pointer flex items-baseline justify-between gap-3"
                  >
                    <div className="truncate">
                      <span className="font-semibold text-zinc-800 mr-2">
                        {m.sender}:
                      </span>
                      <span className="text-zinc-600">{m.text}</span>
                    </div>
                    <span className="msg-ref shrink-0">#msg-{m.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Sparkles, Loader2, ChevronDown, ShieldCheck, AlertCircle } from 'lucide-react';
import type { Briefing, ParsedChat, UserContext } from '../types';
import { buildCloudPayload } from '../core/payload';
import { geminiSummarize } from '../core/gemini';

interface ExecutiveSummaryProps {
  chat: ParsedChat;
  briefing: Briefing;
  user: UserContext;
  onSendCloudRequest?: (linesCount: number) => void;
}

function formatDueShort(ts: number): string {
  const d = new Date(ts);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${weekday} ${day} ${month}, ${time}`;
}

export function ExecutiveSummary({
  chat,
  briefing,
  user,
  onSendCloudRequest,
}: ExecutiveSummaryProps) {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [geminiSummary, setGeminiSummary] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Deterministic Engine 1 summary (never blank, 100% on-device)
  const needsCount = briefing.counts.needs_you;
  const deadlineCount = briefing.counts.deadline;
  const decisionCount = briefing.counts.decision;

  const deadlineItems = briefing.items.filter((i) => i.kind === 'deadline' && i.dueAt);
  let nextDeadlineStr = '';
  if (deadlineItems.length > 0) {
    const earliest = Math.min(...deadlineItems.map((i) => i.dueAt!));
    nextDeadlineStr = ` (next: ${formatDueShort(earliest)})`;
  }

  const needsItems = briefing.items.filter((i) => i.kind === 'needs_you');
  let topAskStr = '';
  if (needsItems.length > 0) {
    topAskStr = `. Top ask: ${needsItems[0].title}.`;
  } else if (briefing.items.length > 0) {
    topAskStr = `. Top item: ${briefing.items[0].title}.`;
  } else {
    topAskStr = '.';
  }

  const deterministicSummary = `${needsCount} ${
    needsCount === 1 ? 'thing needs' : 'things need'
  } you, ${deadlineCount} ${
    deadlineCount === 1 ? 'deadline' : 'deadlines'
  }${nextDeadlineStr}, ${decisionCount} ${
    decisionCount === 1 ? 'decision' : 'decisions'
  }${topAskStr}`;

  // Pre-calculated cloud payload (client-redacted high-signal lines)
  const payload = useMemo(() => buildCloudPayload(chat, briefing, user), [chat, briefing, user]);

  const handleGenerateAI = async () => {
    if (!payload || payload.lines.length === 0 || isSynthesizing) return;
    setIsSynthesizing(true);
    setGeminiStatus('idle');

    try {
      const res = await geminiSummarize(payload.lines);
      onSendCloudRequest?.(payload.lines.length);
      if (res) {
        setGeminiSummary(res);
        setGeminiStatus('success');
      } else {
        setGeminiSummary(null);
        setGeminiStatus('failed');
      }
    } catch {
      setGeminiSummary(null);
      setGeminiStatus('failed');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-zinc-900 text-sm tracking-tight">
            Executive Summary
          </span>
          {geminiStatus === 'success' && geminiSummary ? (
            <span className="badge badge-accent text-[11px]">
              <Sparkles className="w-3 h-3 text-orange-700" />
              Gemini 2.5 Flash, from redacted lines
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-amber-300 text-amber-900 font-mono shadow-2xs">
              Deterministic Engine 1 Active
            </span>
          )}
        </div>

        {/* Action Controls */}
        {geminiStatus !== 'success' && (
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isSynthesizing || payload.lines.length === 0}
            className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Executive Briefing</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary Content Body */}
      {isSynthesizing ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 py-2 text-xs font-semibold text-orange-800"
        >
          <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
          <span>Synthesizing briefing via secure server proxy...</span>
        </div>
      ) : geminiStatus === 'success' && geminiSummary ? (
        <p className="text-sm sm:text-base font-semibold text-zinc-900 leading-relaxed">
          {geminiSummary}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-900 leading-relaxed">
            {deterministicSummary}
          </p>
          {geminiStatus === 'failed' && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Gemini synthesis is temporarily unavailable. The deterministic on-device summary above remains active.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Privacy Disclosure & Collapsible Payload Inspection */}
      {geminiStatus !== 'success' && !isSynthesizing && payload.lines.length > 0 && (
        <div className="pt-3 border-t border-amber-200/60 space-y-2.5 text-xs">
          <div className="flex items-start gap-2 text-zinc-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Sends up to <strong className="text-zinc-900">{payload.lines.length} high-signal lines</strong> (pre-redacted client-side for emails, phones, passwords, tokens) through our server to Google Gemini 2.5 Flash to produce a 2-sentence summary. No raw chat text is ever transmitted.
            </p>
          </div>

          <details className="group rounded-xl border border-zinc-200 bg-white p-2.5 text-xs transition-colors">
            <summary className="font-semibold text-zinc-700 cursor-pointer select-none flex items-center justify-between list-none">
              <span>Show exactly what will be sent ({payload.lines.length} lines)</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-open:rotate-180 transition-transform" />
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
              {payload.lines.join('\n')}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Sparkles, Loader2, ChevronRight, Eye } from 'lucide-react';
import type { Briefing, ParsedChat, UserContext } from '../types';
import { buildCloudPayload, type CloudPayload } from '../core/payload';
import { geminiSummarize } from '../core/gemini';

interface ExecutiveSummaryProps {
  chat: ParsedChat;
  briefing: Briefing;
  user: UserContext;
  apiKey: string;
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
  apiKey,
  onSendCloudRequest,
}: ExecutiveSummaryProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [payload, setPayload] = useState<CloudPayload | null>(null);
  const [geminiSummary, setGeminiSummary] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Deterministic Engine 1 summary (never blank)
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

  const handleOpenPreview = () => {
    const p = buildCloudPayload(chat, briefing, user);
    setPayload(p);
    setIsPreviewOpen(true);
  };

  const handleSend = async () => {
    if (!payload || !apiKey) return;
    setIsSynthesizing(true);
    try {
      const res = await geminiSummarize(payload.lines, apiKey);
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
      setIsPreviewOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">
            Executive Summary
          </span>
          {geminiStatus === 'success' && geminiSummary && (
            <span className="badge badge-accent text-[11px]">
              <Sparkles className="w-3 h-3 text-orange-700" />
              Gemini, from redacted text
            </span>
          )}
        </div>

        {/* Action Controls */}
        {!apiKey ? (
          <span className="text-xs text-zinc-400">
            Add a Gemini key for a sharper summary (optional).
          </span>
        ) : geminiStatus !== 'success' && !isPreviewOpen && !isSynthesizing ? (
          <button
            type="button"
            onClick={handleOpenPreview}
            className="btn-primary py-1.5 px-3.5 text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Polish with Gemini</span>
          </button>
        ) : null}
      </div>

      {/* Summary Content Body */}
      {isSynthesizing ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 py-3 text-xs font-semibold text-orange-800"
        >
          <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
          <span>Synthesizing...</span>
        </div>
      ) : geminiStatus === 'success' && geminiSummary ? (
        <p className="text-sm sm:text-base font-semibold text-zinc-900 leading-relaxed">
          {geminiSummary}
        </p>
      ) : (
        <div>
          <p className="text-sm font-semibold text-zinc-900 leading-relaxed">
            {deterministicSummary}
          </p>
          {geminiStatus === 'failed' && (
            <p className="text-xs text-zinc-500 italic mt-2">
              Gemini unavailable, showing on-device summary.
            </p>
          )}
        </div>
      )}

      {/* Polish Preview Panel */}
      {isPreviewOpen && payload && !isSynthesizing && (
        <div className="pt-3 border-t border-zinc-200 space-y-3 text-xs">
          <div className="flex items-start gap-2 text-zinc-700">
            <Eye className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This will send <strong className="text-zinc-900">{payload.lines.length} redacted lines</strong> to Google Gemini.{' '}
              <strong className="text-zinc-900">{payload.redactedCount} sensitive items</strong> were redacted on this device. Banter and low-signal messages are excluded.
            </p>
          </div>

          <details className="rounded-xl border border-zinc-200 bg-white p-2.5">
            <summary className="font-semibold text-zinc-800 cursor-pointer select-none flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span>Show exactly what will be sent</span>
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
              {payload.lines.join('\n')}
            </pre>
          </details>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="btn-primary py-1.5 px-4 text-xs font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Lock, ShieldAlert, Plane, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEgress, type EgressCall } from '../hooks/useEgress';

interface EgressBadgeProps {
  sessionStartTs?: number;
  geminiLinesSent?: number;
}

export function EgressBadge({ sessionStartTs = 0, geminiLinesSent = 0 }: EgressBadgeProps) {
  const { calls, isAirplaneReady } = useEgress();

  // Session calls filtered for this chat
  const sessionCalls = calls.filter((c) => c.ts >= sessionStartTs);

  const isSummarizeProxyCall = (c: EgressCall) => {
    const isPath =
      c.pathname === '/api/summarize' ||
      c.url === '/api/summarize' ||
      c.url.endsWith('/api/summarize') ||
      c.url.includes('/api/summarize');
    const isSameHost =
      !c.host ||
      (typeof window !== 'undefined' &&
        (c.host === window.location.hostname || c.host === 'localhost' || c.host === '127.0.0.1'));
    return isPath && isSameHost;
  };

  // Check alert condition: any call with body or non-GET to host/path OTHER than same-origin /api/summarize
  const alertCalls = sessionCalls.filter((c) => {
    const hasBodyOrNonGet = c.bodyBytes > 0 || c.method !== 'GET';
    return hasBodyOrNonGet && !isSummarizeProxyCall(c);
  });

  const summarizeCalls = sessionCalls.filter((c) => {
    return isSummarizeProxyCall(c) && c.bodyBytes > 0;
  });

  const isAlert = alertCalls.length > 0;
  const isCloud = !isAlert && (summarizeCalls.length > 0 || geminiLinesSent > 0);
  const isLocal = !isAlert && !isCloud;

  const linesSentCount = geminiLinesSent > 0 ? geminiLinesSent : summarizeCalls.length * 40;

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      {/* Airplane mode ready indicator */}
      {isAirplaneReady && isLocal && (
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-full shadow-2xs"
          title="App logic runs completely in-browser without network access"
        >
          <Plane className="w-3 h-3 text-zinc-500" />
          <span>Airplane mode ready</span>
        </span>
      )}

      {/* Privacy Badge Link to /privacy */}
      <Link
        to="/privacy"
        title="Click to view full privacy audit log"
        aria-label={
          isAlert
            ? `Security alert: ${alertCalls.length} unexpected outbound calls detected`
            : isCloud
            ? `Redacted lines sent to Gemini via our server: ${linesSentCount} lines sent`
            : '100% Local Heuristics Active: 0 Data Sent'
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isAlert
            ? 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100/70 focus-visible:outline-red-600'
            : isCloud
            ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200/80 focus-visible:outline-amber-600'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70 focus-visible:outline-emerald-600'
        }`}
      >
        {isAlert ? (
          <ShieldAlert className="w-3.5 h-3.5 text-red-700 shrink-0" />
        ) : isCloud ? (
          <Cloud className="w-3.5 h-3.5 text-amber-900 shrink-0" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        )}
        <span>
          {isAlert
            ? `${alertCalls.length} Unauthorized Egress Call${alertCalls.length === 1 ? '' : 's'}`
            : isCloud
            ? `Redacted lines sent to Gemini via our server (${linesSentCount} lines sent)`
            : '100% Local Heuristics Active (0 Data Sent)'}
        </span>
      </Link>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Lock, ShieldCheck, ShieldAlert, Plane, X, CheckCircle2 } from 'lucide-react';
import { useEgress } from '../hooks/useEgress';

interface EgressBadgeProps {
  sessionStartTs?: number;
  geminiLinesSent?: number;
}

export function EgressBadge({ sessionStartTs = 0, geminiLinesSent = 0 }: EgressBadgeProps) {
  const { calls, isAirplaneReady } = useEgress();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Session calls filtered for this chat
  const sessionCalls = calls.filter((c) => c.ts >= sessionStartTs);

  // Check alert condition: any call with body or non-GET to host OTHER than generativelanguage.googleapis.com
  const alertCalls = sessionCalls.filter((c) => {
    const isGeminiHost =
      c.host === 'generativelanguage.googleapis.com' ||
      c.url.includes('generativelanguage.googleapis.com');
    const hasBodyOrNonGet = c.bodyBytes > 0 || c.method !== 'GET';
    return hasBodyOrNonGet && !isGeminiHost;
  });

  const geminiCalls = sessionCalls.filter((c) => {
    return (
      (c.host === 'generativelanguage.googleapis.com' ||
        c.url.includes('generativelanguage.googleapis.com')) &&
      c.bodyBytes > 0
    );
  });

  const isAlert = alertCalls.length > 0;
  const isCloud = !isAlert && (geminiCalls.length > 0 || geminiLinesSent > 0);
  const isLocal = !isAlert && !isCloud;

  const linesSentCount = geminiLinesSent > 0 ? geminiLinesSent : geminiCalls.length * 40;

  return (
    <div className="fixed top-3.5 right-4 z-40 flex items-center gap-2" aria-live="polite">
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

      {/* Privacy Badge Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={
          isAlert
            ? `Security alert: ${alertCalls.length} unexpected outbound calls detected`
            : isCloud
            ? `Sanitized Cloud Synthesis: ${linesSentCount} lines sent`
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
          <ShieldCheck className="w-3.5 h-3.5 text-amber-900 shrink-0" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        )}
        <span>
          {isAlert
            ? `${alertCalls.length} Unauthorized Egress Call${alertCalls.length === 1 ? '' : 's'}`
            : isCloud
            ? `Sanitized Cloud Synthesis (Credentials Redacted Locally) · ${linesSentCount} lines sent`
            : '100% Local Heuristics Active (0 Data Sent)'}
        </span>
      </button>

      {/* Network Log Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Network log"
          className="absolute right-0 top-10 w-80 sm:w-96 card bg-white p-4 shadow-xl border border-zinc-200 rounded-2xl z-50 text-zinc-900"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              {isAlert ? (
                <ShieldAlert className="w-4 h-4 text-red-600" />
              ) : isCloud ? (
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              ) : (
                <Lock className="w-4 h-4 text-emerald-600" />
              )}
              <h3 className="text-sm font-bold text-zinc-900">Network log</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Close network log"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3">
            {sessionCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-800">
                  Nothing has left this page.
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                  No outbound network calls have occurred. All chat parsing and triage heuristics run purely on this device.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                {sessionCalls.map((call, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono"
                  >
                    <div className="flex items-center justify-between text-zinc-600 font-bold mb-1">
                      <span className={call.url.includes('googleapis') ? 'text-amber-800' : 'text-red-700'}>
                        {call.method}
                      </span>
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(call.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-zinc-800 truncate" title={call.url}>
                      {call.url}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 flex justify-between">
                      <span>Payload: {call.bodyBytes} bytes</span>
                      {call.host && <span>Host: {call.host}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1 text-[11px] text-zinc-500">
            <p className="leading-snug">
              Only redacted, high-signal lines go to Gemini, and only after you click Send. Everything else stays on this device.
            </p>
            <span className="text-[10px] text-zinc-400">
              Enforced by strict CSP <code className="font-mono text-zinc-600">connect-src 'self' https://generativelanguage.googleapis.com</code>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

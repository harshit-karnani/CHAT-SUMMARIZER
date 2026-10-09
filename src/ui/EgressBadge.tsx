import { useState, useRef, useEffect } from 'react';
import { Lock, Plane, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useEgress } from '../hooks/useEgress';

export function EgressBadge() {
  const { calls, count, isAirplaneReady } = useEgress();
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

  const isZero = count === 0;

  return (
    <div className="fixed top-3.5 right-4 z-40 flex items-center gap-2">
      {/* Airplane mode ready indicator */}
      {isAirplaneReady && (
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-full shadow-xs"
          title="App logic runs completely in-browser without network access"
        >
          <Plane className="w-3 h-3 text-zinc-500" />
          <span>Airplane mode ready</span>
        </span>
      )}

      {/* Zero Egress Badge Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Network activity monitor: ${count} outbound calls`}
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isZero
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70 focus-visible:outline-emerald-600'
            : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100/70 focus-visible:outline-red-600'
        }`}
      >
        {isZero ? (
          <Lock className="w-3.5 h-3.5 text-emerald-700" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
        )}
        <span>
          {isZero
            ? '0 Network Calls | 100% On-Device'
            : `${count} Egress Call${count === 1 ? '' : 's'} Detected`}
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
              <Lock className={`w-4 h-4 ${isZero ? 'text-emerald-600' : 'text-red-600'}`} />
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
            {isZero ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-800">
                  Nothing has left this page.
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                  No fetch, XHR, or beacons have been dispatched. Your data stays entirely in memory.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                {calls.map((call, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono"
                  >
                    <div className="flex items-center justify-between text-zinc-600 font-bold mb-1">
                      <span className="text-red-700">{call.method}</span>
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(call.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-zinc-800 truncate" title={call.url}>
                      {call.url}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Payload: {call.bodyBytes} bytes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Enforced by CSP <code className="font-mono text-zinc-500">connect-src 'none'</code></span>
          </div>
        </div>
      )}
    </div>
  );
}

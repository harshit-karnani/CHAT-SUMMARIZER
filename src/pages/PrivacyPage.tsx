import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Cloud, ShieldAlert, ArrowLeft, CheckCircle2, FileCode, Server } from 'lucide-react';
import { useEgress } from '../hooks/useEgress';

export function PrivacyPage() {
  const { calls } = useEgress();

  useEffect(() => {
    document.title = 'Network & Privacy Log — SplitOff';
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200/80">
        <div>
          <Link
            to="/briefing"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Briefing</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-900">
            Network & Privacy Audit Log
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            Transparent, real-time log of every network attempt intercepted in this browser session.
          </p>
        </div>
      </div>

      {/* 1. Architecture Flow Explainer */}
      <section className="card p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-display font-bold text-zinc-900">
            Hybrid Privacy-Gated Architecture
          </h2>
        </div>
        <p className="text-xs text-zinc-600 font-sans leading-relaxed">
          SplitOff operates on a <strong>deterministic-first, zero-egress default</strong>. Full chat parsing, date resolution, action-item scoring, and heuristic briefing generation execute entirely inside your browser tab without any network traffic.
        </p>
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono text-[11px] text-zinc-700 leading-relaxed overflow-x-auto">
          <code>
            [Client: Local Chat Parsing & Heuristics] (100% in RAM)
            <br />
            &nbsp;&nbsp;&darr; (Only if user clicks &ldquo;Generate Executive Briefing&rdquo;)
            <br />
            [Client-Side Regex Redactor] (Strips passwords, keys, phones, emails, OTPs)
            <br />
            &nbsp;&nbsp;&darr;
            <br />
            [Same-Origin POST /api/summarize] (Rate-limited, origin-verified, serverless proxy)
            <br />
            &nbsp;&nbsp;&darr; (Server holds GEMINI_API_KEY &mdash; zero keys on client)
            <br />
            [Google Gemini 2.5 Flash] &rarr; Returns 2-sentence executive summary
          </code>
        </div>
      </section>

      {/* 2. Badge States Explainer */}
      <section className="card p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <h2 className="text-sm font-display font-bold text-zinc-900">
          Privacy Badge States Explained
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>LOCAL (Green)</span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed font-sans">
              100% Local Heuristics Active (0 Data Sent). All chat unzipping, regex parsing, relative dates, and scoring run purely in client RAM.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Cloud className="w-3.5 h-3.5 text-amber-800" />
              <span>CLOUD (Amber)</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed font-sans">
              Redacted lines sent via server proxy. Triggered only when you explicitly click &ldquo;Generate Executive Briefing&rdquo;. Credentials and PII are scrubbed locally before transmission.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-red-900">
              <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
              <span>ALERT (Red)</span>
            </div>
            <p className="text-[11px] text-red-900 leading-relaxed font-sans">
              Unauthorized Egress. Displays immediately if any request with a payload or non-GET method targets an endpoint other than the same-origin summary proxy.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Client-Side Redactor Explainer */}
      <section className="card p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-display font-bold text-zinc-900">
            Client-Side Redactor Specifications (<code className="font-mono text-xs">src/core/redactor.ts</code>)
          </h2>
        </div>
        <p className="text-xs text-zinc-600 font-sans leading-relaxed">
          Before any high-signal message line is bundled for optional Gemini synthesis, it is processed through deterministic regex redaction on your device:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <strong className="text-zinc-900 block mb-0.5">Scrubbed Credentials:</strong>
            <span className="text-zinc-500 text-[11px]">
              Passwords (<code className="font-mono">password is...</code>), tokens, API keys, Google keys (<code className="font-mono">AIza...</code>), Bearer tokens, URL query params.
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <strong className="text-zinc-900 block mb-0.5">Scrubbed Contacts & PII:</strong>
            <span className="text-zinc-500 text-[11px]">
              Email addresses, international phone numbers (+CC), 10-digit Indian mobiles, card-like 13-19 digit numbers.
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <strong className="text-zinc-900 block mb-0.5">Contextual OTP Protection:</strong>
            <span className="text-zinc-500 text-[11px]">
              4-8 digit codes only redacted when paired with context words (<code className="font-mono">otp, code, verification, pin</code>) so years (2026) and amounts remain intact.
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <strong className="text-zinc-900 block mb-0.5">Payload Filtering:</strong>
            <span className="text-zinc-500 text-[11px]">
              Only triage candidates with score &ge; 25. Max 40 lines, capped at 6,000 characters. Low-signal banter and media excluded.
            </span>
          </div>
        </div>
      </section>

      {/* 4. Session Network Interceptor Log Table */}
      <section className="card p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <h2 className="text-sm font-display font-bold text-zinc-900">
            Real-Time Network Calls ({calls.length})
          </h2>
          <span className="text-[11px] font-mono text-zinc-400">
            Intercepted via window.__egress
          </span>
        </div>

        {calls.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="text-sm font-display font-bold text-zinc-900">
              Nothing has left this page.
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-sans leading-relaxed">
              Zero network calls have been initiated. All WhatsApp data stays entirely within this browser tab's sandbox.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {calls.map((call, idx) => {
              const isSummarize = call.url.includes('/api/summarize');
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 font-mono text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          isSummarize
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {call.method}
                      </span>
                      <span className="text-zinc-800 font-semibold truncate max-w-sm">
                        {call.host || window.location.hostname || 'Same Origin'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(call.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 truncate" title={call.url}>
                    {call.url}
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-0.5">
                    Payload size: {call.bodyBytes} bytes
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

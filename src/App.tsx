import { useMemo } from 'react';
import { parseChat } from './core/parser';
import { buildBriefing } from './core/briefing';
import { demoChat, DEMO_USER } from './data/demo';
import { ShieldCheck, Sparkles, Clock, CheckCircle2, UserCheck } from 'lucide-react';

export default function App() {
  const { parsed, briefing } = useMemo(() => {
    try {
      const p = parseChat(demoChat);
      const b = buildBriefing(p, DEMO_USER);
      return { parsed: p, briefing: b };
    } catch (err) {
      console.error('Error during demo initialization:', err);
      return { parsed: null, briefing: null };
    }
  }, []);

  const messageCount = parsed?.messages.length ?? 0;
  const itemCount = briefing?.items.length ?? 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col items-center justify-center p-6 antialiased">
      {/* Header */}
      <header className="mb-8 text-center max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
          <span>Zero-Egress · Client-Only Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          CatchUp Zero
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Executive briefings for WhatsApp chats. 100% deterministic, in-browser heuristics.
        </p>
      </header>

      {/* Main Status Card */}
      <main className="w-full max-w-md">
        <div className="card p-6 bg-white shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-zinc-400">
                Core Engine Status
              </div>
              <h2 className="text-lg font-bold text-zinc-900">
                Engine 1 ready: {messageCount} messages parsed, {itemCount} items found
              </h2>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
            The deterministic briefing engine parsed the bundled demo export and clustered actionable items for user{' '}
            <span className="font-semibold text-zinc-800">@{DEMO_USER.me}</span> with zero server egress.
          </p>

          {/* Planted Categories Verification */}
          {briefing && (
            <div className="space-y-2.5 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                  <UserCheck className="w-4 h-4 text-red-500" />
                  Direct Asks (Needs You)
                </span>
                <span className="badge badge-needs-you">
                  {briefing.counts.needs_you} items
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Time-Sensitive Deadlines
                </span>
                <span className="badge badge-deadline">
                  {briefing.counts.deadline} items
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  Locked Group Decisions
                </span>
                <span className="badge badge-decision">
                  {briefing.counts.decision} items
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Format: {parsed?.format.toUpperCase()} ({parsed?.dateOrder.toUpperCase()})</span>
            <span className="font-mono">connect-src 'none'</span>
          </div>
        </div>
      </main>
    </div>
  );
}

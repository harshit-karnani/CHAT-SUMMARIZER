import { useState } from 'react';
import { parseChat } from './core/parser';
import { buildBriefing } from './core/briefing';
import { demoChat, DEMO_USER, demoLastReadAt } from './data/demo';
import type { ParsedChat, Briefing, UserContext } from './types';
import { EgressBadge } from './ui/EgressBadge';
import { Dropzone } from './ui/Dropzone';
import { SetupCard } from './ui/SetupCard';
import { StagedProgress, type PipelineStage } from './ui/StagedProgress';
import { EmptyState } from './ui/EmptyState';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [userContext, setUserContext] = useState<UserContext>({
    me: 'Kabir',
    aliases: ['Kabir', 'kabi'],
    lastReadAt: demoLastReadAt(),
  });
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(true);

  const handleLoadChat = (rawText: string, isDemo = false) => {
    try {
      setErrorMsg(null);
      const parsed = parseChat(rawText);
      setChat(parsed);

      if (isDemo) {
        setUserContext({
          me: DEMO_USER.me,
          aliases: [...DEMO_USER.aliases],
          lastReadAt: demoLastReadAt(),
        });
      } else {
        const defaultSender = parsed.senders[0] || 'Me';
        const defaultFirstName = defaultSender.split(' ')[0];
        const index60 = Math.floor(parsed.messages.length * 0.6);
        const defaultLastRead = parsed.messages[index60]?.ts ?? Date.now();

        setUserContext({
          me: defaultSender,
          aliases: [defaultSender, defaultFirstName].filter(Boolean),
          lastReadAt: defaultLastRead,
        });
      }

      setBriefing(null);
      setIsConfiguring(true);
      setStage('idle');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid chat export file.';
      setErrorMsg(msg);
      setChat(null);
    }
  };

  const handleLoadDemo = () => {
    handleLoadChat(demoChat, true);
  };

  const handleRunBriefing = () => {
    if (!chat) return;

    setStage('reading');
    setTimeout(() => {
      setStage('mentions');
      setTimeout(() => {
        setStage('dates');
        setTimeout(() => {
          setStage('building');
          setTimeout(() => {
            try {
              const b = buildBriefing(chat, userContext);
              setBriefing(b);
              setIsConfiguring(false);
              setStage('done');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Briefing generation failed.';
              setErrorMsg(msg);
              setStage('idle');
            }
          }, 110);
        }, 110);
      }, 110);
    }, 110);
  };

  const handleResetChat = () => {
    setChat(null);
    setBriefing(null);
    setStage('idle');
    setErrorMsg(null);
    setIsConfiguring(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col items-center py-10 px-4 sm:px-6 antialiased relative">
      <EgressBadge />

      {/* Main App Header */}
      <header className="mb-6 text-center max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold mb-2.5">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-800" />
          <span>Zero-Egress · Client-Only Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          CatchUp Zero
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Executive briefings for WhatsApp chats. 100% deterministic, in-browser heuristics.
        </p>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex flex-col items-center">
        {/* 1. File Upload Dropzone (if no chat loaded) */}
        {!chat && (
          <Dropzone
            onLoadChat={(txt) => handleLoadChat(txt, false)}
            onLoadDemo={handleLoadDemo}
            errorMessage={errorMsg}
          />
        )}

        {/* 2. Setup Card (when chat is loaded and configuring) */}
        {chat && isConfiguring && stage === 'idle' && (
          <SetupCard
            chat={chat}
            userContext={userContext}
            onChangeUser={setUserContext}
            onGenerate={handleRunBriefing}
            onResetChat={handleResetChat}
            isProcessing={stage !== 'idle'}
          />
        )}

        {/* 3. Staged Pipeline Loader */}
        <StagedProgress currentStage={stage} />

        {/* 4. Briefing Output or Empty State (when generated) */}
        {chat && !isConfiguring && stage === 'done' && (
          <>
            {briefing && briefing.items.length === 0 ? (
              <EmptyState onAdjustTime={() => setIsConfiguring(true)} />
            ) : (
              <div className="w-full card p-6 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">
                      Briefing Generated
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {briefing?.items.length} items found across {briefing?.missedCount} unread messages
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfiguring(true)}
                    className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                  >
                    Adjust parameters
                  </button>
                </div>
                <div className="text-xs text-zinc-600">
                  Ready for full briefing view.
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

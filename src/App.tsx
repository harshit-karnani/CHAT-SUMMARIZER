import { useState } from 'react';
import { parseChat } from './core/parser';
import { buildBriefing } from './core/briefing';
import { demoChat, DEMO_USER, demoLastReadAt } from './data/demo';
import type { ParsedChat, Briefing, UserContext, BriefingItem } from './types';
import { EgressBadge } from './ui/EgressBadge';
import { Dropzone } from './ui/Dropzone';
import { SetupCard } from './ui/SetupCard';
import { StagedProgress, type PipelineStage } from './ui/StagedProgress';
import { EmptyState } from './ui/EmptyState';
import { BriefingView } from './ui/BriefingView';
import { GapStrip } from './ui/GapStrip';
import { ContextDrawer } from './ui/ContextDrawer';
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

  // Lineage Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTargetId, setDrawerTargetId] = useState<number | null>(null);
  const [drawerSourceIds, setDrawerSourceIds] = useState<number[]>([]);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

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
    setIsDrawerOpen(false);
  };

  const handleOpenContext = (targetMsgId: number, sourceIds: number[] = []) => {
    setDrawerTargetId(targetMsgId);
    setDrawerSourceIds(sourceIds.length > 0 ? sourceIds : [targetMsgId]);
    setIsDrawerOpen(true);
  };

  const handleSelectPin = (item: BriefingItem) => {
    setHighlightedItemId(item.id);

    // Scroll to matching card
    const cardEl = document.getElementById(`briefing-card-${item.id}`);
    if (cardEl) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      cardEl.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }

    // Open context drawer for this item
    const primaryId = item.sourceMessageIds[0] ?? 1;
    handleOpenContext(primaryId, item.sourceMessageIds);

    // Clear highlight ring after delay
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col items-center py-8 px-4 sm:px-6 antialiased relative">
      {/* Skip to Main Content Link for A11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-zinc-950 focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Zero Egress Badge */}
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
      <main id="main-content" className="w-full max-w-5xl flex flex-col items-center">
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
        {chat && !isConfiguring && stage === 'done' && briefing && (
          <>
            {briefing.items.length === 0 ? (
              <EmptyState onAdjustTime={() => setIsConfiguring(true)} />
            ) : (
              <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
                {/* Desktop Left Rail: Quick setup & stats summary */}
                <aside
                  aria-label="Briefing session metadata"
                  className="w-full lg:w-72 shrink-0 card p-4 sm:p-5 bg-white border border-zinc-200 shadow-xs space-y-4"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      User Context
                    </span>
                    <div className="text-sm font-bold text-zinc-900 mt-0.5">
                      @{userContext.me}
                    </div>
                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                      Aliases: {userContext.aliases.join(', ')}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Chat Window
                    </span>
                    <div className="text-xs text-zinc-700 mt-1">
                      {chat.messages.length} messages total
                    </div>
                    <div className="text-xs text-orange-700 font-semibold mt-0.5">
                      {briefing.missedCount} unread missed
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfiguring(true)}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 transition-colors cursor-pointer"
                    >
                      Reconfigure parameters
                    </button>
                    <button
                      type="button"
                      onClick={handleResetChat}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Upload different chat
                    </button>
                  </div>
                </aside>

                {/* Right Column: Minimap & Briefing View */}
                <div className="flex-1 w-full min-w-0">
                  {/* Step 4: Density Gap Strip Minimap */}
                  <GapStrip
                    chatSpan={briefing.chatSpan}
                    slice={briefing.slice}
                    items={briefing.items}
                    allMessages={chat.messages}
                    onSelectPin={handleSelectPin}
                  />

                  {/* Step 3: Briefing View */}
                  <BriefingView
                    briefing={briefing}
                    allMessages={chat.messages}
                    onOpenContext={(msgId) => {
                      const item = briefing.items.find((i) => i.sourceMessageIds.includes(msgId));
                      handleOpenContext(msgId, item ? item.sourceMessageIds : [msgId]);
                    }}
                    onAdjustParameters={() => setIsConfiguring(true)}
                    highlightedItemId={highlightedItemId}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Step 5: Context Lineage Drawer */}
      {chat && (
        <ContextDrawer
          isOpen={isDrawerOpen}
          targetMessageId={drawerTargetId}
          sourceMessageIds={drawerSourceIds}
          allMessages={chat.messages}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { GapStrip } from '../ui/GapStrip';
import { BriefingView } from '../ui/BriefingView';
import { ContextDrawer } from '../ui/ContextDrawer';
import { EmptyState } from '../ui/EmptyState';
import { useChat } from '../context/useChat';
import type { BriefingItem } from '../types';

export function BriefingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    chat,
    userContext,
    briefing,
    isHydrating,
    forgetChat,
    setGeminiLinesSent,
    isStoredLocally,
  } = useChat();

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Executive Briefing — CatchUp Zero';
  }, []);

  // Route guards
  useEffect(() => {
    if (!isHydrating) {
      if (!chat) {
        navigate('/', { replace: true });
      } else if (!briefing) {
        navigate('/setup', { replace: true });
      }
    }
  }, [isHydrating, chat, briefing, navigate]);

  // Read message ID from URL for deep linking & refresh persistence
  const msgParam = searchParams.get('msg');
  const drawerTargetId = msgParam ? parseInt(msgParam, 10) : null;
  const isDrawerOpen = drawerTargetId !== null && !isNaN(drawerTargetId);

  // Determine source IDs for the drawer target
  const activeItem = briefing?.items.find((i) =>
    i.sourceMessageIds.includes(drawerTargetId || -1)
  );
  const drawerSourceIds = activeItem ? activeItem.sourceMessageIds : drawerTargetId ? [drawerTargetId] : [];

  const handleOpenContext = (targetMsgId: number) => {
    setSearchParams({ msg: String(targetMsgId) });
  };

  const handleCloseDrawer = () => {
    setSearchParams({});
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

    const primaryId = item.sourceMessageIds[0] ?? 1;
    handleOpenContext(primaryId);

    setTimeout(() => {
      setHighlightedItemId(null);
    }, 1500);
  };

  if (isHydrating) {
    return (
      <div className="card p-8 bg-white border border-zinc-200/80 max-w-md w-full mx-auto text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
        <h2 className="text-sm font-display font-bold text-zinc-900">Restoring briefing...</h2>
        <p className="text-xs text-zinc-500 font-sans">
          Rebuilding session from local browser memory.
        </p>
      </div>
    );
  }

  if (!chat || !briefing) return null;

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {briefing.items.length === 0 ? (
        <EmptyState onAdjustTime={() => navigate('/setup')} />
      ) : (
        <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
          {/* Desktop Left Rail: Quick setup & stats summary */}
          <aside
            aria-label="Briefing session metadata"
            className="w-full lg:w-72 shrink-0 card p-4 sm:p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-4"
          >
            <div>
              <span className="text-[10px] font-display uppercase font-bold text-zinc-400 tracking-wider">
                User Context
              </span>
              <div className="text-sm font-bold text-zinc-900 mt-0.5">
                @{userContext.me}
              </div>
              <div className="text-xs text-zinc-500 truncate mt-0.5 font-sans">
                Aliases: {userContext.aliases.join(', ')}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <span className="text-[10px] font-display uppercase font-bold text-zinc-400 tracking-wider">
                Chat Window
              </span>
              <div className="text-xs text-zinc-700 mt-1 font-sans">
                {chat.messages.length} messages total
              </div>
              <div className="text-xs text-orange-700 font-semibold mt-0.5">
                {briefing.missedCount} unread missed
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/setup')}
                className="btn-secondary w-full text-xs justify-start gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                <span>Change who I am / last read</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-secondary w-full text-xs justify-start gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" />
                <span>Load a different chat</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await forgetChat();
                  navigate('/');
                }}
                className="btn-secondary w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 justify-start gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Forget this chat</span>
              </button>
            </div>

            {isStoredLocally && (
              <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 leading-normal">
                This chat is saved only in this browser so refresh works. Nothing is uploaded. Forget it any time.
              </p>
            )}
          </aside>

          {/* Right Column: Minimap & Briefing View */}
          <div className="flex-1 w-full min-w-0">
            {/* Density Gap Strip Minimap */}
            <GapStrip
              chatSpan={briefing.chatSpan}
              slice={briefing.slice}
              items={briefing.items}
              allMessages={chat.messages}
              onSelectPin={handleSelectPin}
            />

            {/* Briefing View Cards & Executive Summary */}
            <BriefingView
              chat={chat}
              briefing={briefing}
              user={userContext}
              allMessages={chat.messages}
              onOpenContext={handleOpenContext}
              onAdjustParameters={() => navigate('/setup')}
              onSendCloudRequest={(linesCount) => {
                setGeminiLinesSent((prev) => prev + linesCount);
              }}
              highlightedItemId={highlightedItemId}
            />
          </div>
        </div>
      )}

      {/* Evidence Drawer ("What was actually said") */}
      {chat && (
        <ContextDrawer
          isOpen={isDrawerOpen}
          targetMessageId={drawerTargetId}
          sourceMessageIds={drawerSourceIds}
          allMessages={chat.messages}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}

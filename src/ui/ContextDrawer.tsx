import { useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';
import type { Message } from '../types';

interface ContextDrawerProps {
  isOpen: boolean;
  targetMessageId: number | null;
  sourceMessageIds: number[];
  allMessages: Message[];
  onClose: () => void;
}

function formatContextTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase()}`;
}

export function ContextDrawer({
  isOpen,
  targetMessageId,
  sourceMessageIds,
  allMessages,
  onClose,
}: ContextDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store trigger for focus restore
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Focus drawer on open
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap & ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || targetMessageId === null) return null;

  const targetIdx = allMessages.findIndex((m) => m.id === targetMessageId);
  const startIdx = Math.max(0, targetIdx - 5);
  const endIdx = Math.min(allMessages.length, targetIdx + 6);
  const windowMessages = allMessages.slice(startIdx, endIdx);

  const sourceSet = new Set(sourceMessageIds);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Drawer Container: right-side drawer on desktop, bottom-sheet on mobile */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-[85vh] max-sm:pl-0"
      >
        <div className="w-screen max-w-md bg-white shadow-2xl border-l max-sm:border-t max-sm:border-l-0 border-zinc-200 flex flex-col rounded-l-2xl max-sm:rounded-l-none max-sm:rounded-t-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-600" />
              <div>
                <h2 id="drawer-title" className="text-sm sm:text-base font-bold text-zinc-900">
                  What was actually said
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Raw verbatim WhatsApp export (5 before, 5 after)
                </p>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Close message context"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transcript Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAFAFA]">
            {windowMessages.map((m) => {
              const isSource = sourceSet.has(m.id);
              const isCenterTarget = m.id === targetMessageId;

              if (m.isSystem) {
                return (
                  <div
                    key={m.id}
                    className="p-2 text-center text-[11px] text-zinc-400 font-mono italic bg-zinc-100/60 rounded-lg border border-dashed border-zinc-200/70"
                  >
                    <span>#msg-{m.id}: {m.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  id={`drawer-msg-${m.id}`}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isSource
                      ? 'bg-amber-50/70 border-amber-300/80 shadow-xs ring-1 ring-amber-300'
                      : 'bg-white border-zinc-200 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className={`font-bold ${
                        isSource ? 'text-amber-950 font-extrabold' : 'text-zinc-800'
                      }`}
                    >
                      {m.sender}
                      {isCenterTarget && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-orange-500 text-zinc-950 font-bold">
                          Primary
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 text-zinc-400 font-mono">
                      <span>{formatContextTimestamp(m.ts)}</span>
                      <span className="text-[10px]">#msg-{m.id}</span>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 font-sans">
                    {m.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-zinc-100 bg-white flex items-center justify-between text-xs text-zinc-500">
            <span className="text-[11px]">Exact raw export lines · Zero hallucination</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

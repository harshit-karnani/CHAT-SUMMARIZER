import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { parseChat } from '../core/parser';
import { buildBriefing } from '../core/briefing';
import { DEMO_USER, demoLastReadAt } from '../data/demo';
import { saveSession, loadSession, clearSession } from '../core/store';
import type { ParsedChat, Briefing, UserContext } from '../types';
import type { PipelineStage } from '../ui/StagedProgress';

interface ChatContextType {
  chat: ParsedChat | null;
  rawText: string | null;
  userContext: UserContext;
  setUserContext: (ctx: UserContext) => void;
  updateUserContextAndPersist: (ctx: UserContext) => void;
  briefing: Briefing | null;
  isHydrating: boolean;
  stage: PipelineStage;
  errorMsg: string | null;
  isStoredLocally: boolean;
  sessionStartTs: number;
  geminiLinesSent: number;
  setGeminiLinesSent: React.Dispatch<React.SetStateAction<number>>;
  loadChat: (raw: string, isDemo?: boolean) => boolean;
  runBriefing: () => Promise<boolean>;
  forgetChat: () => Promise<void>;
  resetToSetup: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext>({
    me: 'Kabir',
    aliases: ['Kabir', 'kabi'],
    lastReadAt: demoLastReadAt(),
  });
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [isStoredLocally, setIsStoredLocally] = useState<boolean>(false);
  const [sessionStartTs, setSessionStartTs] = useState<number>(() => Date.now());
  const [geminiLinesSent, setGeminiLinesSent] = useState<number>(0);

  // Restore session from IndexedDB on initial load
  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const stored = await loadSession();
        if (mounted && stored && stored.rawText) {
          const parsed = parseChat(stored.rawText);
          const uCtx: UserContext = {
            me: stored.sender || parsed.senders[0] || 'Me',
            aliases: stored.aliases || [stored.sender],
            lastReadAt: stored.lastReadAt || parsed.messages[Math.floor(parsed.messages.length * 0.6)]?.ts || Date.now(),
          };
          setRawText(stored.rawText);
          setChat(parsed);
          setUserContext(uCtx);
          setIsStoredLocally(true);

          // Rebuild briefing automatically
          try {
            const b = buildBriefing(parsed, uCtx);
            setBriefing(b);
          } catch {
            // keep idle if build fails
          }
        }
      } catch {
        // storage unavailable
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    }
    restore();
    return () => {
      mounted = false;
    };
  }, []);

  const loadChat = useCallback((raw: string, isDemo = false): boolean => {
    try {
      setErrorMsg(null);
      const parsed = parseChat(raw);
      setRawText(raw);
      setChat(parsed);

      let uCtx: UserContext;
      if (isDemo) {
        uCtx = {
          me: DEMO_USER.me,
          aliases: [...DEMO_USER.aliases],
          lastReadAt: demoLastReadAt(),
        };
      } else {
        const defaultSender = parsed.senders[0] || 'Me';
        const defaultFirstName = defaultSender.split(' ')[0];
        const index60 = Math.floor(parsed.messages.length * 0.6);
        const defaultLastRead = parsed.messages[index60]?.ts ?? Date.now();
        uCtx = {
          me: defaultSender,
          aliases: [defaultSender, defaultFirstName].filter(Boolean),
          lastReadAt: defaultLastRead,
        };
      }

      setUserContext(uCtx);
      setBriefing(null);
      setStage('idle');
      setSessionStartTs(Date.now());
      setGeminiLinesSent(0);
      if (typeof window !== 'undefined' && window.__egress) {
        window.__egress.length = 0;
        try {
          window.dispatchEvent(new CustomEvent('egress-call', { detail: null }));
        } catch {}
      }

      // Persist in IndexedDB
      saveSession(raw, uCtx.me, uCtx.aliases, uCtx.lastReadAt).then((ok) => {
        setIsStoredLocally(ok);
      });

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid chat export file.';
      setErrorMsg(msg);
      setChat(null);
      setRawText(null);
      return false;
    }
  }, []);

  const updateUserContextAndPersist = useCallback(
    (ctx: UserContext) => {
      setUserContext(ctx);
      if (rawText) {
        saveSession(rawText, ctx.me, ctx.aliases, ctx.lastReadAt).then((ok) => {
          setIsStoredLocally(ok);
        });
      }
    },
    [rawText]
  );

  const runBriefing = useCallback(async (): Promise<boolean> => {
    if (!chat) return false;

    setStage('reading');
    await new Promise((r) => setTimeout(r, 110));
    setStage('mentions');
    await new Promise((r) => setTimeout(r, 110));
    setStage('dates');
    await new Promise((r) => setTimeout(r, 110));
    setStage('building');
    await new Promise((r) => setTimeout(r, 110));

    try {
      const b = buildBriefing(chat, userContext);
      setBriefing(b);
      setStage('done');
      if (rawText) {
        saveSession(rawText, userContext.me, userContext.aliases, userContext.lastReadAt);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Briefing generation failed.';
      setErrorMsg(msg);
      setStage('idle');
      return false;
    }
  }, [chat, userContext, rawText]);

  const forgetChat = useCallback(async () => {
    await clearSession();
    setChat(null);
    setRawText(null);
    setBriefing(null);
    setStage('idle');
    setErrorMsg(null);
    setIsStoredLocally(false);
    setSessionStartTs(Date.now());
    setGeminiLinesSent(0);
    if (typeof window !== 'undefined' && window.__egress) {
      window.__egress.length = 0;
      try {
        window.dispatchEvent(new CustomEvent('egress-call', { detail: null }));
      } catch {}
    }
  }, []);

  const resetToSetup = useCallback(() => {
    setStage('idle');
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chat,
        rawText,
        userContext,
        setUserContext,
        updateUserContextAndPersist,
        briefing,
        isHydrating,
        stage,
        errorMsg,
        isStoredLocally,
        sessionStartTs,
        geminiLinesSent,
        setGeminiLinesSent,
        loadChat,
        runBriefing,
        forgetChat,
        resetToSetup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}

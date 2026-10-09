import { createContext } from 'react';
import type { Briefing, ParsedChat, UserContext } from '../types';
import type { PipelineStage } from '../ui/StagedProgress';

export type { PipelineStage };

export interface ChatContextType {
  chat: ParsedChat | null;
  rawText: string | null;
  userContext: UserContext;
  setUserContext: React.Dispatch<React.SetStateAction<UserContext>>;
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

export const ChatContext = createContext<ChatContextType | null>(null);

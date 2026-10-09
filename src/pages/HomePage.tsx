import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, RotateCcw, Trash2, HelpCircle, ShieldCheck } from 'lucide-react';
import { Dropzone } from '../ui/Dropzone';
import { demoChat } from '../data/demo';
import { useChat } from '../context/useChat';

export function HomePage() {
  const navigate = useNavigate();
  const {
    chat,
    rawText,
    userContext,
    isStoredLocally,
    loadChat,
    forgetChat,
    errorMsg,
  } = useChat();

  useEffect(() => {
    document.title = 'CatchUp Zero — WhatsApp Briefing';
  }, []);

  const handleFileDrop = (txt: string) => {
    const success = loadChat(txt, false);
    if (success) {
      navigate('/setup');
    }
  };

  const handleDemoClick = () => {
    const success = loadChat(demoChat, true);
    if (success) {
      navigate('/setup');
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Hero Header */}
      <div className="text-center max-w-lg mb-2">
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-zinc-900">
          Executive WhatsApp Briefing
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-sans leading-relaxed">
          Transform unread group chats into prioritized, actionable executive summaries in under 600ms. 100% deterministic heuristics on-device.
        </p>
      </div>

      {/* Recent Session Card (if stored chat exists) */}
      {chat && rawText && (
        <div className="w-full max-w-lg card p-5 bg-white border border-orange-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-display uppercase tracking-wider font-bold text-orange-600 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Chat Session Found
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {chat.messages.length} messages
            </span>
          </div>

          <p className="text-xs text-zinc-700 leading-relaxed font-sans">
            Currently configured for <strong className="text-zinc-900">@{userContext.me}</strong> with {chat.senders.length} active participants in this chat.
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/briefing')}
              className="btn-primary py-1.5 px-3.5 text-xs font-semibold cursor-pointer"
            >
              <span>Resume Briefing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/setup')}
              className="btn-secondary text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reconfigure</span>
            </button>
            <button
              type="button"
              onClick={forgetChat}
              className="btn-secondary text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Forget this chat</span>
            </button>
          </div>

          {isStoredLocally && (
            <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
              This chat is saved only in this browser so refresh works. Nothing is uploaded. Forget it any time.
            </p>
          )}
        </div>
      )}

      {/* Main File Ingestion Dropzone */}
      <div className="w-full max-w-lg">
        <Dropzone
          onLoadChat={handleFileDrop}
          onLoadDemo={handleDemoClick}
          errorMessage={errorMsg}
        />
      </div>

      {/* Help Link Footer */}
      <div className="text-center pt-2">
        <Link
          to="/help"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 underline transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How to export from WhatsApp (Android & iPhone)</span>
        </Link>
      </div>
    </div>
  );
}

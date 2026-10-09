import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupCard } from '../ui/SetupCard';
import { StagedProgress } from '../ui/StagedProgress';
import { useChat } from '../context/ChatContext';

export function SetupPage() {
  const navigate = useNavigate();
  const {
    chat,
    userContext,
    updateUserContextAndPersist,
    runBriefing,
    stage,
    isHydrating,
    forgetChat,
  } = useChat();

  useEffect(() => {
    document.title = 'Setup Briefing — CatchUp Zero';
  }, []);

  useEffect(() => {
    if (!isHydrating && !chat) {
      navigate('/', { replace: true });
    }
  }, [isHydrating, chat, navigate]);

  if (isHydrating) {
    return (
      <div className="card p-8 bg-white border border-zinc-200/80 max-w-md w-full mx-auto text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
        <h2 className="text-sm font-display font-bold text-zinc-900">Restoring your chat...</h2>
        <p className="text-xs text-zinc-500 font-sans">
          Rebuilding session from local browser memory.
        </p>
      </div>
    );
  }

  if (!chat) return null;

  const handleGenerate = async () => {
    const success = await runBriefing();
    if (success) {
      navigate('/briefing');
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div className="text-center max-w-md mb-1">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-900">
          Setup Your Identity
        </h1>
        <p className="mt-1 text-xs text-zinc-500 font-sans">
          Anchor your identity and missed window to surface what matters.
        </p>
      </div>

      <SetupCard
        chat={chat}
        userContext={userContext}
        onChangeUser={updateUserContextAndPersist}
        onGenerate={handleGenerate}
        onResetChat={forgetChat}
        isProcessing={stage !== 'idle'}
      />

      <StagedProgress currentStage={stage} />
    </div>
  );
}

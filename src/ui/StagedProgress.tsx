import { CheckCircle2, Loader2 } from 'lucide-react';

export type PipelineStage =
  | 'idle'
  | 'reading'
  | 'mentions'
  | 'dates'
  | 'building'
  | 'done';

interface StagedProgressProps {
  currentStage: PipelineStage;
}

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'reading', label: 'Reading chat messages' },
  { id: 'mentions', label: 'Spotting mentions & direct asks' },
  { id: 'dates', label: 'Resolving dates & deadlines' },
  { id: 'building', label: 'Building executive briefing' },
];

export function StagedProgress({ currentStage }: StagedProgressProps) {
  if (currentStage === 'idle' || currentStage === 'done') return null;

  const getStageIndex = (stage: PipelineStage) => {
    switch (stage) {
      case 'reading':
        return 0;
      case 'mentions':
        return 1;
      case 'dates':
        return 2;
      case 'building':
        return 3;
      default:
        return 4;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div
      role="status"
      aria-live="polite"
      className="card p-6 bg-white shadow-md border border-zinc-200 w-full max-w-md mx-auto my-6 text-zinc-900"
    >
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
        <h3 className="text-sm font-bold text-zinc-900">
          Generating Briefing...
        </h3>
      </div>

      <div className="space-y-3">
        {STAGES.map((s, idx) => {
          const isFinished = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 text-xs transition-opacity duration-150 ${
                isFinished
                  ? 'text-zinc-500 font-normal'
                  : isCurrent
                  ? 'text-zinc-900 font-semibold'
                  : 'text-zinc-300'
              }`}
            >
              {isFinished ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-zinc-200 shrink-0" />
              )}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

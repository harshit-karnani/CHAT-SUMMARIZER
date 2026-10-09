import { CheckCircle, SlidersHorizontal } from 'lucide-react';

interface EmptyStateProps {
  onAdjustTime?: () => void;
}

export function EmptyState({ onAdjustTime }: EmptyStateProps) {
  return (
    <div className="card p-8 bg-white border border-zinc-200 shadow-xs text-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3.5">
        <CheckCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">
        Nothing needs you. Genuinely.
      </h3>
      <p className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
        None of the unread messages contained direct asks, upcoming deadlines, or critical decisions requiring your input.
      </p>
      {onAdjustTime && (
        <button
          type="button"
          onClick={onAdjustTime}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Adjust last checked time</span>
        </button>
      )}
    </div>
  );
}

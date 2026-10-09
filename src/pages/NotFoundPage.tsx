import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — CatchUp Zero';
  }, []);

  return (
    <div className="w-full max-w-md mx-auto text-center card p-8 bg-white border border-zinc-200/80 shadow-2xs space-y-4 my-12">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto text-lg font-bold font-display">
        404
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-display font-extrabold text-zinc-900">
          Page Not Found
        </h1>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          The requested route doesn't exist or has moved. Return to the briefing engine.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-2">
        <Link
          to="/"
          className="btn-primary py-2 px-4 text-xs font-semibold"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Go Home</span>
        </Link>
        <Link
          to="/help"
          className="btn-secondary text-xs"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Export Help</span>
        </Link>
      </div>
    </div>
  );
}

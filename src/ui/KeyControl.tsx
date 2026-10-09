import { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { KeyRound, X, Check, Trash2, ExternalLink } from 'lucide-react';

interface KeyControlProps {
  onKeyChange: (key: string) => void;
}

export function KeyControl({ onKeyChange }: KeyControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const existing = typeof window !== 'undefined'
      ? sessionStorage.getItem('catchup_gemini_key')
      : null;
    const exists = Boolean(existing && existing.trim().length > 0);
    setHasKey(exists);
    if (exists && existing) {
      onKeyChange(existing.trim());
    }
  }, [onKeyChange]);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap and ESC close
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setIsOpen(false);
      return;
    }

    if (e.key === 'Tab') {
      const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

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
  };

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      sessionStorage.setItem('catchup_gemini_key', trimmed);
      setHasKey(true);
      onKeyChange(trimmed);
      setInputValue('');
      setIsOpen(false);
    }
  };

  const handleRemove = () => {
    sessionStorage.removeItem('catchup_gemini_key');
    setHasKey(false);
    onKeyChange('');
    setInputValue('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer min-h-[38px] sm:min-h-[36px]"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
        <span>Gemini API Key (Optional Polish)</span>
        {hasKey && (
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
            title="Key active in this tab"
          />
        )}
      </button>

      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="key-dialog-title"
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md card p-5 bg-white border border-zinc-200 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h2 id="key-dialog-title" className="text-sm font-bold text-zinc-900">
                  Gemini API Key
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="gemini-key-input"
                className="text-xs font-semibold text-zinc-700 block"
              >
                Google Gemini API Key
              </label>
              <input
                ref={inputRef}
                id="gemini-key-input"
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={hasKey ? 'Key currently configured (hidden)' : 'Paste Google Gemini API key here'}
                autoComplete="off"
                spellCheck="false"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                Stored only in this browser tab (<code className="font-mono text-[10px] bg-zinc-100 px-1 py-0.5 rounded">sessionStorage</code>). Never saved to a server or the repo. Get a free key at{' '}
                <a
                  href="https://aistudio.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-orange-700 font-semibold underline hover:text-orange-800"
                >
                  <span>aistudio.google.com</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              {hasKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="mr-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Key</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="btn-primary py-2 px-4 text-xs font-semibold disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Key</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

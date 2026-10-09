import { useState } from 'react';
import { ChevronDown, HelpCircle, Smartphone } from 'lucide-react';

export function ExportInstructions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-4 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/70 transition-all text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-zinc-700 font-semibold hover:bg-zinc-100/70 transition-colors cursor-pointer text-left"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
          How to export your chat from WhatsApp
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-3.5 pt-1 space-y-3 text-zinc-600 border-t border-zinc-200/60 bg-white">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 mb-1">
              <Smartphone className="w-3 h-3 text-zinc-600" />
              Android:
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed pl-1 text-zinc-600">
              <li>Open the chat or group in WhatsApp.</li>
              <li>Tap the three dots menu (⋮) → <strong>More</strong> → <strong>Export chat</strong>.</li>
              <li>Select <strong>Without media</strong>.</li>
              <li>Save or share the exported <code className="font-mono text-zinc-800">.txt</code> or <code className="font-mono text-zinc-800">.zip</code> file here.</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 mb-1">
              <Smartphone className="w-3 h-3 text-zinc-600" />
              iPhone (iOS):
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed pl-1 text-zinc-600">
              <li>Open the chat and tap the contact/group name at the top.</li>
              <li>Scroll down and tap <strong>Export Chat</strong>.</li>
              <li>Select <strong>Without Media</strong>.</li>
              <li>Save to Files and upload the resulting archive or text file.</li>
            </ol>
          </div>

          <div className="p-2 rounded-lg bg-orange-50/70 border border-orange-100 text-[11px] text-orange-900 leading-normal">
            <strong>Privacy guarantee:</strong> Files are parsed strictly in your browser RAM. No text leaves your computer.
          </div>
        </div>
      )}
    </div>
  );
}

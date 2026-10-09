import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Apple, KeyRound, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';

export function HelpPage() {
  useEffect(() => {
    document.title = 'Export Guide & FAQ — CatchUp Zero';
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200/80">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-zinc-900">
          WhatsApp Export Guide & FAQ
        </h1>
        <p className="mt-1 text-xs text-zinc-500 font-sans">
          Step-by-step instructions for exporting chat logs and configuring optional synthesis.
        </p>
      </div>

      {/* 1. How to Export from WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Android Guide */}
        <section className="card p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 font-display font-bold text-zinc-900 text-sm">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <h2>How to Export from Android</h2>
          </div>
          <ol className="list-decimal list-inside text-xs text-zinc-600 space-y-2 font-sans leading-relaxed">
            <li>Open the WhatsApp chat or group you want to brief.</li>
            <li>Tap the <strong className="text-zinc-800">three vertical dots (⋮)</strong> in the top-right corner.</li>
            <li>Select <strong className="text-zinc-800">More</strong> &rarr; <strong className="text-zinc-800">Export chat</strong>.</li>
            <li>Select <strong className="text-zinc-900">Without Media</strong> (CatchUp Zero only parses text logs).</li>
            <li>Save or share the exported <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">.txt</code> file and drop it into CatchUp Zero.</li>
          </ol>
        </section>

        {/* iPhone Guide */}
        <section className="card p-5 bg-white border border-zinc-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 font-display font-bold text-zinc-900 text-sm">
            <Apple className="w-4 h-4 text-zinc-900" />
            <h2>How to Export from iPhone (iOS)</h2>
          </div>
          <ol className="list-decimal list-inside text-xs text-zinc-600 space-y-2 font-sans leading-relaxed">
            <li>Open the WhatsApp conversation or group.</li>
            <li>Tap the contact or group name at the top of the screen.</li>
            <li>Scroll down and tap <strong className="text-zinc-800">Export Chat</strong>.</li>
            <li>Choose <strong className="text-zinc-900">Without Media</strong>.</li>
            <li>Save the resulting <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">.zip</code> or <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">_chat.txt</code> to Files or AirDrop to your laptop, then drop it into CatchUp Zero.</li>
          </ol>
        </section>
      </div>

      {/* 2. Gemini Setup Guide */}
      <section className="card p-5 sm:p-6 bg-white border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-display font-bold text-zinc-900">
              Gemini Setup (Optional Polish Layer)
            </h2>
            <p className="text-xs text-zinc-500 font-sans">
              Produce an executive 2-sentence synthesis using Google Gemini 2.5 Flash.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs font-sans text-zinc-700 leading-relaxed">
          <p>
            CatchUp Zero includes an optional synthesis layer. Engine 1 works completely offline without it. If you want a sharper summary:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>
              Get a free API key at{' '}
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-700 font-semibold underline inline-flex items-center gap-0.5"
              >
                <span>aistudio.google.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>.
            </li>
            <li>Open the <strong className="text-zinc-900">Gemini API Key</strong> button in the header bar.</li>
            <li>Paste your key into the masked password field and click <strong className="text-zinc-900">Save Key</strong>.</li>
            <li>
              On the briefing page, click <strong className="text-zinc-900">Polish with Gemini</strong>.
            </li>
            <li>
              Review the preview panel showing the exact redacted lines, then click <strong className="text-zinc-900">Send</strong>.
            </li>
          </ol>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 space-y-1 mt-2">
            <strong>Key Security Notice:</strong>
            <p>
              Your key is saved only in this browser tab's <code className="font-mono bg-zinc-200/70 px-1 py-0.5 rounded">sessionStorage</code>. It is never stored on a server, in the repository, or in build bundles. The key lives only in that tab and must be re-entered in a new tab or browser session.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Frequently Asked Questions (FAQ) */}
      <section className="card p-5 sm:p-6 bg-white border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-zinc-700" />
          <h2 className="text-sm sm:text-base font-display font-bold text-zinc-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <h3 className="font-bold text-zinc-900">
              Does CatchUp Zero upload my chat conversations?
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              No. By default, 0 network calls leave this page. Parsing, date extraction, triage scoring, clustering, and calendar generation run entirely in your local browser sandbox.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-zinc-900">
              How does page refresh preserve my data?
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Your chat transcript and identity settings are persisted on-device in <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">IndexedDB</code>. You can delete all local data at any time using the "Forget this chat" button.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-zinc-900">
              What does the redactor scrub before sending to Gemini?
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Passwords, API keys, tokens, Bearer headers, credit cards, emails, phone numbers, and verification OTPs are replaced with <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">[REDACTED]</code> on-device. You can inspect the exact payload before dispatching.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

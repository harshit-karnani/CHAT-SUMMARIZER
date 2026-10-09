import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Apple, Sparkles, ArrowLeft, HelpCircle, ShieldCheck } from 'lucide-react';

export function HelpPage() {
  useEffect(() => {
    document.title = 'Export Guide & FAQ — SplitOff';
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
          Step-by-step instructions for exporting chat logs and how SplitOff's hybrid privacy engine works.
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
            <li>Select <strong className="text-zinc-900">Without Media</strong> (SplitOff only parses text logs).</li>
            <li>Save or share the exported <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">.txt</code> file and drop it into SplitOff.</li>
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
            <li>Save the resulting <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">.zip</code> or <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">_chat.txt</code> to Files or AirDrop to your laptop, then drop it into SplitOff.</li>
          </ol>
        </section>
      </div>

      {/* 2. How the AI Summary Works (Zero-Key Serverless Proxy) */}
      <section className="card p-5 sm:p-6 bg-white border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-display font-bold text-zinc-900">
              How the Optional AI Summary Works (Zero-Key Setup)
            </h2>
            <p className="text-xs text-zinc-500 font-sans">
              Produce an executive 2-sentence synthesis using Google Gemini 2.5 Flash without needing to enter any API keys.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs font-sans text-zinc-700 leading-relaxed">
          <p>
            SplitOff's Engine 1 is 100% deterministic and runs offline on your device without any AI keys or network calls. When you want an executive narrative summary, SplitOff offers a seamless serverless proxy:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="font-bold text-zinc-900 block">1. Pre-Redacted Locally</span>
              <p className="text-zinc-500 text-[11px]">
                Your device scrubs all passwords, credentials, credit cards, phones, and emails before anything is transmitted.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="font-bold text-zinc-900 block">2. Serverless Proxy</span>
              <p className="text-zinc-500 text-[11px]">
                Pre-redacted lines are dispatched to our same-origin <code className="font-mono">/api/summarize</code> proxy. The API key is securely managed on the server.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="font-bold text-zinc-900 block">3. 2-Sentence Briefing</span>
              <p className="text-zinc-500 text-[11px]">
                Google Gemini 2.5 Flash synthesizes the high-signal lines into a concise narrative. If the proxy fails, your deterministic summary is instantly preserved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 font-medium mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Zero Configuration Required:</strong> You never need to supply an API key. Everything works out of the box.
            </span>
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
              Does SplitOff upload my chat conversations?
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

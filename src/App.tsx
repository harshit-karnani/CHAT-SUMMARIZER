import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { Navigation } from './ui/Navigation';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { BriefingPage } from './pages/BriefingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { HelpPage } from './pages/HelpPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <ChatProvider>
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col items-center py-6 px-4 sm:px-6 antialiased relative font-sans">
          {/* Skip link for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-zinc-950 focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none"
          >
            Skip to main content
          </a>

          {/* Persistent Top Navigation Bar */}
          <Navigation />

          {/* Main Routed View Container */}
          <main id="main-content" className="w-full max-w-5xl flex flex-col items-center flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/briefing" element={<BriefingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <footer className="w-full max-w-5xl mt-12 pt-4 border-t border-zinc-200/80 text-center text-xs text-zinc-400 font-sans flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CatchUp Zero · Executive WhatsApp Briefing Engine</span>
            <span>100% Client-Only · Zero-Egress Core</span>
          </footer>
        </div>
      </ChatProvider>
    </BrowserRouter>
  );
}

import { NavLink } from 'react-router-dom';
import { ShieldCheck, Home, Settings2, FileText, Lock, HelpCircle } from 'lucide-react';
import { EgressBadge } from './EgressBadge';
import { useChat } from '../context/ChatContext';

export function Navigation() {
  const { sessionStartTs, geminiLinesSent, chat, isStoredLocally } = useChat();

  return (
    <header className="w-full max-w-5xl mb-6">
      {/* Top Banner: Privacy & Status Notice */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3 border-b border-zinc-200/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-orange-700" />
            <span>Zero-Egress · 100% On-Device Engine</span>
          </div>
          {isStoredLocally && (
            <span className="hidden md:inline text-[11px] text-zinc-500">
              Saved in local browser memory.
            </span>
          )}
        </div>

        {/* Top Right: Privacy Badge */}
        <div className="flex items-center gap-2">
          <EgressBadge
            sessionStartTs={sessionStartTs}
            geminiLinesSent={geminiLinesSent}
          />
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card p-2.5 sm:px-4 bg-white border border-zinc-200/80 shadow-2xs rounded-xl">
        <NavLink
          to="/"
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 flex items-center justify-center text-zinc-950 font-display font-bold text-xs shadow-2xs">
            Z
          </div>
          <div>
            <div className="text-sm font-display font-bold tracking-tight text-zinc-900 group-hover:text-orange-600 transition-colors">
              CatchUp Zero
            </div>
            <div className="text-[10px] text-zinc-400 leading-none">
              WhatsApp Briefing Engine
            </div>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center text-xs font-sans font-medium"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`
            }
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/setup"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : chat
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`
            }
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Setup</span>
          </NavLink>

          <NavLink
            to="/briefing"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : chat
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`
            }
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Briefing</span>
          </NavLink>

          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`
            }
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Log</span>
          </NavLink>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`
            }
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

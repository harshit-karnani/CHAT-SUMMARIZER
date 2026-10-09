import { useState, useId, type KeyboardEvent } from 'react';
import { User, Tag, Clock, Sparkles, X, RotateCcw } from 'lucide-react';
import type { ParsedChat, UserContext } from '../types';

interface SetupCardProps {
  chat: ParsedChat;
  userContext: UserContext;
  onChangeUser: (user: UserContext) => void;
  onGenerate: () => void;
  onResetChat?: () => void;
  isProcessing?: boolean;
}

function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SetupCard({
  chat,
  userContext,
  onChangeUser,
  onGenerate,
  onResetChat,
  isProcessing = false,
}: SetupCardProps) {
  const minTs = chat.messages[0]?.ts ?? Date.now();
  const maxTs = chat.messages[chat.messages.length - 1]?.ts ?? Date.now();

  const [aliasInput, setAliasInput] = useState('');
  const senderGroupId = useId();

  // Compute live missed messages count
  const missedCount = chat.messages.filter(
    (m) => m.ts > userContext.lastReadAt
  ).length;

  const handleSelectSender = (sender: string) => {
    const firstName = sender.split(' ')[0].trim();
    const existing = new Set(userContext.aliases);
    existing.add(sender);
    if (firstName) existing.add(firstName);

    onChangeUser({
      ...userContext,
      me: sender,
      aliases: Array.from(existing),
    });
  };

  const handleAddAlias = () => {
    const trimmed = aliasInput.trim().replace(/^@/, '');
    if (!trimmed) return;
    if (!userContext.aliases.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      onChangeUser({
        ...userContext,
        aliases: [...userContext.aliases, trimmed],
      });
    }
    setAliasInput('');
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    onChangeUser({
      ...userContext,
      aliases: userContext.aliases.filter(
        (a) => a.toLowerCase() !== aliasToRemove.toLowerCase()
      ),
    });
  };

  const handleKeyDownAlias = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddAlias();
    }
  };

  const handleSliderChange = (newVal: number) => {
    const clamped = Math.max(minTs, Math.min(maxTs, newVal));
    onChangeUser({
      ...userContext,
      lastReadAt: clamped,
    });
  };

  const handleDatetimeChange = (isoString: string) => {
    const parsedTs = new Date(isoString).getTime();
    if (!isNaN(parsedTs)) {
      handleSliderChange(parsedTs);
    }
  };

  // Preset calculation relative to chat latest message
  const applyPreset = (preset: 'last_night' | 'this_morning' | 'two_days_ago') => {
    const maxDate = new Date(maxTs);
    let targetTs = maxTs;

    if (preset === 'this_morning') {
      const d = new Date(maxDate);
      d.setHours(9, 0, 0, 0);
      if (d.getTime() >= maxTs) {
        d.setDate(d.getDate() - 1);
      }
      targetTs = d.getTime();
    } else if (preset === 'last_night') {
      const d = new Date(maxDate);
      d.setDate(d.getDate() - 1);
      d.setHours(22, 0, 0, 0);
      targetTs = d.getTime();
    } else if (preset === 'two_days_ago') {
      targetTs = maxTs - 48 * 3600 * 1000;
    }

    handleSliderChange(targetTs);
  };

  return (
    <div className="card p-5 sm:p-6 bg-white shadow-xs w-full max-w-xl mx-auto space-y-5 text-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Configure Briefing</h2>
          <p className="text-xs text-zinc-500">
            {chat.messages.length} messages loaded ({chat.senders.length} participants)
          </p>
        </div>
        {onResetChat && (
          <button
            type="button"
            onClick={onResetChat}
            className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Upload a different chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Switch chat</span>
          </button>
        )}
      </div>

      {/* 1. Which one are you? */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 mb-2">
          <User className="w-3.5 h-3.5 text-zinc-500" />
          Which one are you?
        </label>
        <div
          role="radiogroup"
          aria-label="Select your participant identity"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          {chat.senders.map((sender) => {
            const isSelected = userContext.me.toLowerCase() === sender.toLowerCase();
            const id = `${senderGroupId}-${sender}`;
            return (
              <label
                key={sender}
                htmlFor={id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/60 text-orange-950 font-semibold shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  id={id}
                  name="participant"
                  value={sender}
                  checked={isSelected}
                  onChange={() => handleSelectSender(sender)}
                  className="accent-orange-600 w-3.5 h-3.5"
                />
                <span className="truncate">{sender}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Aliases */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 mb-1.5">
          <Tag className="w-3.5 h-3.5 text-zinc-500" />
          Your aliases & mentions
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[42px] items-center">
          {userContext.aliases.map((alias) => (
            <span
              key={alias}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-zinc-200 text-zinc-800 shadow-2xs"
            >
              <span>{alias}</span>
              <button
                type="button"
                onClick={() => handleRemoveAlias(alias)}
                aria-label={`Remove alias ${alias}`}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            onKeyDown={handleKeyDownAlias}
            onBlur={handleAddAlias}
            placeholder={userContext.aliases.length === 0 ? "Harshit, bro, H" : "+ add alias"}
            className="flex-1 min-w-[100px] text-xs bg-transparent border-none outline-none text-zinc-800 placeholder-zinc-400 px-1 py-0.5"
          />
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          Press Enter to add. Whole word matches will score mentions.
        </p>
      </div>

      {/* 3. When did you last check this chat? */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            When did you last check this chat?
          </label>
          <span className="text-xs font-semibold text-orange-700">
            You missed {missedCount} message{missedCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Range slider */}
        <div className="space-y-2 py-1">
          <input
            type="range"
            min={minTs}
            max={maxTs}
            step={60000}
            value={userContext.lastReadAt}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            aria-label="Last read chat timestamp slider"
            className="w-full accent-orange-500 cursor-pointer"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <input
              type="datetime-local"
              value={toDatetimeLocal(userContext.lastReadAt)}
              onChange={(e) => handleDatetimeChange(e.target.value)}
              aria-label="Last read chat datetime"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 font-mono focus:border-orange-500 outline-none"
            />

            {/* Presets */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => applyPreset('this_morning')}
                className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 font-medium transition-colors cursor-pointer"
              >
                This morning 9 AM
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last_night')}
                className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 font-medium transition-colors cursor-pointer"
              >
                Last night 10 PM
              </button>
              <button
                type="button"
                onClick={() => applyPreset('two_days_ago')}
                className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 font-medium transition-colors cursor-pointer"
              >
                2 days ago
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Trigger Button */}
      <div className="pt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isProcessing}
          className="btn-primary w-full py-3 text-sm cursor-pointer shadow-md disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4 text-zinc-950" />
          <span>{isProcessing ? 'Analyzing chat...' : 'Show what I missed'}</span>
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Zap, AlertCircle, HelpCircle } from 'lucide-react';
import { readUploadedFile } from '../core/parser';

interface DropzoneProps {
  onLoadChat: (rawText: string, isDemo?: boolean) => void;
  onLoadDemo: () => void;
  errorMessage?: string | null;
}

export function Dropzone({ onLoadChat, onLoadDemo, errorMessage }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileError(null);
    const validExt = file.name.endsWith('.txt') || file.name.endsWith('.zip');
    if (!validExt) {
      setFileError('Unrecognized file format. CatchUp Zero supports .txt exports and .zip archives.');
      return;
    }

    try {
      setIsLoadingFile(true);
      const text = await readUploadedFile(file);
      onLoadChat(text, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to read chat export.';
      setFileError(msg);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="card p-5 sm:p-6 bg-white shadow-2xs w-full max-w-xl mx-auto space-y-4">
      {/* Purposeful Interactive Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Drop your WhatsApp export here, or browse"
        className={`border border-dashed border-zinc-300 bg-zinc-100/50 hover:bg-white hover:border-orange-500 rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
          isDragging ? 'border-orange-500 bg-orange-50/60' : ''
        }`}
      >
        <label htmlFor="chat-export-input" className="sr-only">
          Upload WhatsApp chat export file (.txt or .zip)
        </label>
        <input
          id="chat-export-input"
          ref={fileInputRef}
          type="file"
          accept=".txt,.zip"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-2xs">
          <UploadCloud className="w-5 h-5 text-orange-600" />
        </div>

        <div>
          <span className="text-xs font-semibold text-zinc-900 font-sans">
            {isLoadingFile ? 'Unpacking & reading transcript...' : 'Drop your WhatsApp export here, or browse'}
          </span>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">
            Supports Android <span className="font-mono text-zinc-700">.txt</span> and iOS <span className="font-mono text-zinc-700">.zip</span> (unpacked locally)
          </p>
        </div>
      </div>

      {/* Error Message with Help Link */}
      {(fileError || errorMessage) && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Unable to process export:</span>{' '}
              {fileError || errorMessage}
            </div>
          </div>
          <Link
            to="/help"
            className="text-orange-700 font-semibold underline shrink-0 flex items-center gap-1 hover:text-orange-800"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Export help</span>
          </Link>
        </div>
      )}

      {/* Integrated Load Demo Chat Action */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="text-[11px] text-zinc-400 font-sans text-center sm:text-left">
          No export file ready? Test the full pipeline instantly.
        </div>
        <button
          type="button"
          onClick={onLoadDemo}
          title="sample chat, not real data"
          className="btn-primary py-2 px-3.5 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Load Demo Chat</span>
          <span className="text-[10px] text-zinc-900/70 font-normal hidden sm:inline">
            (sample chat, not real data)
          </span>
        </button>
      </div>
      <div className="text-center">
        <span className="text-[10px] text-zinc-400 font-mono">
          sample chat, not real data (runs offline, 0 network calls)
        </span>
      </div>
    </div>
  );
}

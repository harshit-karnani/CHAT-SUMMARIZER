import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, Zap, FileText, AlertCircle } from 'lucide-react';
import { readUploadedFile } from '../core/parser';
import { ExportInstructions } from './ExportInstructions';

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
      setFileError('Please upload a .txt WhatsApp chat export or .zip archive.');
      return;
    }

    try {
      setIsLoadingFile(true);
      const text = await readUploadedFile(file);
      onLoadChat(text, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to read chat file.';
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
    <div className="card p-6 bg-white shadow-xs w-full max-w-xl mx-auto">
      <div className="text-center mb-5">
        <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
          Drop your WhatsApp export
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Zero-egress analysis. 100% processed in your browser memory.
        </p>
      </div>

      {/* Drag & Drop Zone */}
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
        aria-label="Upload WhatsApp chat export file (.txt or .zip)"
        className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
          isDragging
            ? 'border-orange-500 bg-orange-50/40'
            : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.zip"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-xs">
          <UploadCloud className="w-5 h-5 text-zinc-600" />
        </div>

        <div>
          <span className="text-xs font-semibold text-zinc-800">
            {isLoadingFile ? 'Extracting & parsing file...' : 'Click to select or drag and drop'}
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Supports WhatsApp <span className="font-mono text-zinc-600">.txt</span> and <span className="font-mono text-zinc-600">.zip</span> exports
          </p>
        </div>
      </div>

      {/* Error Message */}
      {(fileError || errorMessage) && (
        <div className="mt-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Unable to parse export:</span>{' '}
            {fileError || errorMessage}
          </div>
        </div>
      )}

      {/* Demo Load Action */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col items-center">
        <button
          type="button"
          onClick={onLoadDemo}
          className="btn-primary w-full sm:w-auto px-6 py-2.5 cursor-pointer shadow-md"
        >
          <Zap className="w-4 h-4 text-zinc-950" />
          <span>Load Demo Chat</span>
        </button>
        <span className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
          <FileText className="w-3 h-3 text-zinc-400" />
          sample chat, not real data (runs offline)
        </span>
      </div>

      {/* WhatsApp export instructions toggle */}
      <ExportInstructions />
    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  Layers,
  FolderTree
} from 'lucide-react';
import { CODEBASE_FILES, generateProjectZip, downloadBlob } from '../services/exportService';

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const currentFile = CODEBASE_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const filename = currentFile.path.split('/').pop() || 'kofi-file.txt';
    downloadBlob(blob, filename);
  };

  const handleDownloadAllZip = async () => {
    setIsDownloading(true);
    try {
      const zipBlob = await generateProjectZip();
      downloadBlob(zipBlob, 'kofi-fintech-platform.zip');
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Polyglot Architecture Source Inspector</h2>
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                  Rust • Go • C# • Java • SQL • Docker
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Browse and export all production-grade microservice implementations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllZip}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Building ZIP...' : 'Download Full ZIP'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-72 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-amber-400" />
              Project Files
            </div>
            {CODEBASE_FILES.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                  selectedFileIndex === idx
                    ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="truncate pr-2">{file.path}</div>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                  {file.language}
                </span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white font-mono">{currentFile.path}</span>
                <span className="text-slate-400 text-[11px] ml-2 hidden sm:inline">
                  — {currentFile.description}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadSingle}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

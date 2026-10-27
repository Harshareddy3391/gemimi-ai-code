import React from 'react';
import { History, X, Trash2, ArrowUpRight, Copy, Check } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onClearHistory,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm sm:max-w-md bg-[#0f1523] border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white text-base">Calculation Tape</h2>
            <span className="text-xs font-mono text-slate-400">({items.length})</span>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Clear all tape"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tape List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <History className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-sm">No calculations yet</p>
              <p className="text-xs text-slate-600 mt-1">Calculations will appear here</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="group p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 cursor-pointer transition flex flex-col gap-1 relative"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="truncate pr-2">{item.expression}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-white group-hover:text-cyan-300 transition break-all">
                    = {item.result}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleCopy(e, item.result, item.id)}
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      title="Copy result"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        onSelectItem(item);
                        onClose();
                      }}
                      className="p-1 rounded bg-cyan-600 text-white"
                      title="Insert into calculator"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center text-xs text-slate-500">
          Click any calculation to load it into the active calculator
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Calculator,
  Binary,
  TrendingUp,
  ArrowLeftRight,
  Grid3X3,
  LineChart,
  Code2,
  History,
  FileCode2,
  Cpu,
  Sparkles
} from 'lucide-react';
import { AngleMode, CalculatorMode } from '../types';

interface HeaderProps {
  currentMode: CalculatorMode;
  onSelectMode: (mode: CalculatorMode) => void;
  angleMode: AngleMode;
  onToggleAngleMode: () => void;
  onToggleHistory: () => void;
  historyCount: number;
  onOpenApiInspector: () => void;
  backendStatus: { ok: boolean; latency?: number };
  engine: 'auto' | 'python' | 'client';
  onChangeEngine: (eng: 'auto' | 'python' | 'client') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  angleMode,
  onToggleAngleMode,
  onToggleHistory,
  historyCount,
  onOpenApiInspector,
  backendStatus,
  engine,
  onChangeEngine,
}) => {
  const modes: { id: CalculatorMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'scientific', label: 'Scientific', icon: Calculator },
    { id: 'programmer', label: 'Programmer', icon: Binary },
    { id: 'financial', label: 'Financial', icon: TrendingUp },
    { id: 'converter', label: 'Converter', icon: ArrowLeftRight },
    { id: 'matrix', label: 'Matrix', icon: Grid3X3 },
    { id: 'graphing', label: 'Graphing', icon: LineChart },
    { id: 'python', label: 'Python REPL', icon: Code2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0f1523]/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Backend Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white tracking-tight text-base sm:text-lg">One Calculator</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                  FastAPI + React
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backendStatus.ok ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-slate-300">
                    {backendStatus.ok
                      ? `Python Engine: Live (${backendStatus.latency ?? 2}ms)`
                      : 'Client Fallback'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Mobile quick actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onToggleHistory}
              aria-label="History tape"
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white relative"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-[10px] font-bold text-slate-900 rounded-full w-4 h-4 flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenApiInspector}
              aria-label="API Inspector"
              className="p-2 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-700/50"
            >
              <FileCode2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center overflow-x-auto w-full md:w-auto py-1 px-1 scrollbar-none gap-1 bg-slate-900/80 rounded-xl p-1 border border-slate-800">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right utility controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Engine Selector */}
          <div className="flex items-center text-xs bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onChangeEngine('auto')}
              title="FastAPI Python engine with automatic client resilience"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                engine === 'auto' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python API
            </button>
            <button
              onClick={() => onChangeEngine('client')}
              title="Execute math directly in browser"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                engine === 'client' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Client
            </button>
          </div>

          {/* Angle mode toggle for scientific */}
          {currentMode === 'scientific' && (
            <button
              onClick={onToggleAngleMode}
              className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 hover:bg-slate-700 transition"
              title="Toggle degrees/radians"
            >
              {angleMode.toUpperCase()}
            </button>
          )}

          {/* History drawer button */}
          <button
            onClick={onToggleHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition relative"
            title="Toggle calculation tape"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {historyCount}
              </span>
            )}
          </button>

          {/* FastAPI backend docs modal */}
          <button
            onClick={onOpenApiInspector}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition"
            title="Inspect FastAPI OpenAPI Schema, endpoints, and Python source"
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>FastAPI Docs</span>
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AngleMode, CalculatorMode, HistoryItem } from './types';
import { CalculatorApiService } from './services/api';
import { Header } from './components/Header';
import { ScientificCalculator } from './components/ScientificCalculator';
import { ProgrammerCalculator } from './components/ProgrammerCalculator';
import { FinancialCalculator } from './components/FinancialCalculator';
import { UnitConverter } from './components/UnitConverter';
import { MatrixCalculator } from './components/MatrixCalculator';
import { GraphingCalculator } from './components/GraphingCalculator';
import { PythonRunner } from './components/PythonRunner';
import { HistoryDrawer } from './components/HistoryDrawer';
import { FastApiInspectorModal } from './components/FastApiInspectorModal';

export default function App() {
  const [currentMode, setCurrentMode] = useState<CalculatorMode>('scientific');
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [engine, setEngine] = useState<'auto' | 'python' | 'client'>('auto');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<{ ok: boolean; latency?: number }>({
    ok: true,
    latency: 2
  });
  const [stagedExpression, setStagedExpression] = useState<string | undefined>(undefined);

  // Ping backend health
  useEffect(() => {
    const check = async () => {
      const status = await CalculatorApiService.checkHealth();
      setBackendStatus({ ok: status.ok, latency: status.latency });
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial history
  useEffect(() => {
    CalculatorApiService.getHistory().then((items) => {
      if (items && items.length > 0) {
        setHistoryItems(items);
      }
    });
  }, []);

  const handleNewHistoryItem = (item: { expression: string; result: string; category: string }) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      expression: item.expression,
      result: item.result,
      category: item.category,
      timestamp: Date.now()
    };
    setHistoryItems((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  const handleClearHistory = async () => {
    await CalculatorApiService.clearHistory();
    setHistoryItems([]);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setCurrentMode('scientific');
    setStagedExpression(item.expression);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Header Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setStagedExpression(undefined);
        }}
        angleMode={angleMode}
        onToggleAngleMode={() => setAngleMode((prev) => (prev === 'deg' ? 'rad' : 'deg'))}
        onToggleHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
        onOpenApiInspector={() => setIsApiModalOpen(true)}
        backendStatus={backendStatus}
        engine={engine}
        onChangeEngine={setEngine}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 md:p-8 flex flex-col justify-center">
        {currentMode === 'scientific' && (
          <ScientificCalculator
            angleMode={angleMode}
            onAngleModeChange={setAngleMode}
            engine={engine}
            onNewHistoryItem={handleNewHistoryItem}
            initialExpression={stagedExpression}
          />
        )}

        {currentMode === 'programmer' && <ProgrammerCalculator />}

        {currentMode === 'financial' && <FinancialCalculator />}

        {currentMode === 'converter' && <UnitConverter />}

        {currentMode === 'matrix' && <MatrixCalculator />}

        {currentMode === 'graphing' && <GraphingCalculator />}

        {currentMode === 'python' && <PythonRunner />}
      </main>

      {/* Bottom Bar Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">One Calculator</span>
            <span>•</span>
            <span>Scientific • Programmer • Financial • Matrix • Graphing • Python FastAPI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              FastAPI OpenAPI Spec
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelectItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* FastAPI Schema & Tester Modal */}
      <FastApiInspectorModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}

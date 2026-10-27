import React, { useState, useEffect, useRef } from 'react';
import {
  Delete,
  RotateCcw,
  Copy,
  Check,
  Percent,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { AngleMode, EvalResponse } from '../types';
import { CalculatorApiService } from '../services/api';

interface ScientificCalculatorProps {
  angleMode: AngleMode;
  onAngleModeChange: (mode: AngleMode) => void;
  engine: 'auto' | 'python' | 'client';
  onNewHistoryItem: (item: { expression: string; result: string; category: string }) => void;
  initialExpression?: string;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  angleMode,
  onAngleModeChange,
  engine,
  onNewHistoryItem,
  initialExpression,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [livePreview, setLivePreview] = useState<string>('');
  const [lastEval, setLastEval] = useState<EvalResponse | null>(null);
  const [isSecond, setIsSecond] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialExpression) {
      setExpression(initialExpression);
    }
  }, [initialExpression]);

  // Live preview evaluation as user types
  useEffect(() => {
    if (!expression || expression.trim() === '') {
      setLivePreview('');
      setErrorMsg(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Fast client-side preview for responsiveness
        const res = await CalculatorApiService.evaluate(expression, angleMode, 8, 'client');
        if (res.status === 'success' && res.formatted !== expression) {
          setLivePreview(res.formatted);
          setErrorMsg(null);
        } else {
          setLivePreview('');
        }
      } catch (e) {
        setLivePreview('');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [expression, angleMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input elsewhere
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        appendSymbol(e.key);
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        appendOperator(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key);
      } else if (e.key === '(' || e.key === ')') {
        appendSymbol(e.key);
      } else if (e.key === '^') {
        appendSymbol('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, angleMode, engine]);

  const appendSymbol = (sym: string) => {
    setErrorMsg(null);
    setExpression((prev) => prev + sym);
  };

  const appendFunction = (fn: string) => {
    setErrorMsg(null);
    setExpression((prev) => prev + fn + '(');
  };

  const appendOperator = (op: string) => {
    setErrorMsg(null);
    setExpression((prev) => {
      const trimmed = prev.trim();
      if (!trimmed && result !== '0' && !errorMsg) {
        return result + ' ' + op + ' ';
      }
      if (['+', '-', '×', '÷', '^', '%'].some((o) => trimmed.endsWith(o))) {
        return trimmed.slice(0, -1) + op + ' ';
      }
      return prev + ' ' + op + ' ';
    });
  };

  const handleClear = () => {
    setExpression('');
    setResult('0');
    setLivePreview('');
    setErrorMsg(null);
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setExpression((prev) => {
      if (prev.endsWith(' ')) return prev.slice(0, -2);
      return prev.slice(0, -1);
    });
  };

  const handleEquals = async () => {
    if (!expression || expression.trim() === '') return;
    setIsLoading(true);
    setErrorMsg(null);

    // Auto-balance parentheses if open
    let balancedExpr = expression;
    const openParen = (expression.match(/\(/g) || []).length;
    const closeParen = (expression.match(/\)/g) || []).length;
    if (openParen > closeParen) {
      balancedExpr += ')'.repeat(openParen - closeParen);
    }

    try {
      const evalRes = await CalculatorApiService.evaluate(balancedExpr, angleMode, 10, engine);
      if (evalRes.status === 'success') {
        setResult(evalRes.formatted);
        setLastEval(evalRes);
        setLivePreview('');
        onNewHistoryItem({
          expression: balancedExpr,
          result: evalRes.formatted,
          category: 'Scientific'
        });
      } else {
        setErrorMsg(evalRes.detail || 'Calculation error');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Syntax error');
    } finally {
      setIsLoading(false);
    }
  };

  // Memory operations
  const memoryClear = () => {
    setMemory(0);
    setHasMemory(false);
  };
  const memoryRecall = () => {
    appendSymbol(String(memory));
  };
  const memoryAdd = () => {
    const val = parseFloat(result) || 0;
    setMemory((prev) => prev + val);
    setHasMemory(true);
  };
  const memorySubtract = () => {
    const val = parseFloat(result) || 0;
    setMemory((prev) => prev - val);
    setHasMemory(true);
  };
  const memoryStore = () => {
    const val = parseFloat(result) || 0;
    setMemory(val);
    setHasMemory(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Open parentheses count indicator
  const openCount = (expression.match(/\(/g) || []).length;
  const closeCount = (expression.match(/\)/g) || []).length;
  const unclosed = Math.max(0, openCount - closeCount);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Calculator Display Glass Container */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800/90 shadow-2xl p-4 sm:p-6 overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar info */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAngleModeChange(angleMode === 'deg' ? 'rad' : 'deg')}
              className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono font-medium hover:bg-slate-700 transition"
            >
              {angleMode.toUpperCase()}
            </button>
            {hasMemory && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                M = {memory}
              </span>
            )}
            {unclosed > 0 && (
              <span className="text-[11px] text-amber-400 font-mono">
                {unclosed} unclosed {unclosed === 1 ? 'paren' : 'parens'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastEval && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Clock className="w-3 h-3 text-cyan-400" />
                {lastEval.engine} • {lastEval.execution_time_ms}ms
              </span>
            )}
            <button
              onClick={copyToClipboard}
              disabled={result === '0'}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Copy result"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Formula Expression Input Display */}
        <div
          ref={displayRef}
          className="min-h-[44px] flex items-center justify-end overflow-x-auto scrollbar-none font-mono text-slate-300 text-base sm:text-xl tracking-wide select-all"
        >
          {expression ? (
            <span className="break-all">{expression}</span>
          ) : (
            <span className="text-slate-600">Enter formula or click keys...</span>
          )}
        </div>

        {/* Live Preview or Error Banner */}
        {errorMsg ? (
          <div className="text-right text-rose-400 text-xs font-mono mt-1 flex items-center justify-end gap-1">
            <Info className="w-3 h-3" />
            <span>{errorMsg}</span>
          </div>
        ) : livePreview ? (
          <div className="text-right text-cyan-400/80 text-sm font-mono mt-1">
            ≈ {livePreview}
          </div>
        ) : null}

        {/* Big Output Result Display */}
        <div className="mt-2 flex items-baseline justify-end gap-2">
          {isLoading && (
            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-2" />
          )}
          <span className="font-mono text-3xl sm:text-5xl font-semibold text-white tracking-tight break-all select-all text-right">
            {result}
          </span>
        </div>
      </div>

      {/* Memory Bar */}
      <div className="grid grid-cols-5 gap-2 px-1">
        {[
          { label: 'MC', action: memoryClear, disabled: !hasMemory },
          { label: 'MR', action: memoryRecall, disabled: !hasMemory },
          { label: 'M+', action: memoryAdd },
          { label: 'M-', action: memorySubtract },
          { label: 'MS', action: memoryStore },
        ].map((m) => (
          <button
            key={m.label}
            onClick={m.action}
            disabled={m.disabled}
            className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono font-medium border border-slate-800/80 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Scientific Keypad Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-2.5">
        {/* Toggle 2nd Functions */}
        <button
          onClick={() => setIsSecond(!isSecond)}
          className={`calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono font-semibold border transition ${
            isSecond
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          2nd
        </button>

        {/* Function keys row 1 */}
        <button
          onClick={() => appendFunction(isSecond ? 'asin' : 'sin')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'sin⁻¹' : 'sin'}
        </button>

        <button
          onClick={() => appendFunction(isSecond ? 'acos' : 'cos')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'cos⁻¹' : 'cos'}
        </button>

        <button
          onClick={() => appendFunction(isSecond ? 'atan' : 'tan')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'tan⁻¹' : 'tan'}
        </button>

        <button
          onClick={handleClear}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-medium bg-rose-950/40 text-rose-300 border border-rose-900/50 hover:bg-rose-900/60 hover:text-white transition"
        >
          AC
        </button>

        <button
          onClick={handleBackspace}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm flex items-center justify-center bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 2 */}
        <button
          onClick={() => appendFunction(isSecond ? 'cbrt' : 'sqrt')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? '∛x' : '√x'}
        </button>

        <button
          onClick={() => appendOperator('^')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          xʸ
        </button>

        <button
          onClick={() => appendFunction(isSecond ? 'log2' : 'log')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'log₂' : 'log₁₀'}
        </button>

        <button
          onClick={() => appendFunction(isSecond ? 'exp' : 'ln')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'eˣ' : 'ln'}
        </button>

        <button
          onClick={() => appendSymbol('(')}
          className="calc-btn py-3 px-2 rounded-xl text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          (
        </button>

        <button
          onClick={() => appendSymbol(')')}
          className="calc-btn py-3 px-2 rounded-xl text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          )
        </button>

        {/* Row 3: Numbers & Constants */}
        <button
          onClick={() => appendSymbol(isSecond ? 'tau' : 'pi')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'τ' : 'π'}
        </button>

        <button
          onClick={() => appendSymbol('7')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          7
        </button>

        <button
          onClick={() => appendSymbol('8')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          8
        </button>

        <button
          onClick={() => appendSymbol('9')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          9
        </button>

        <button
          onClick={() => appendOperator('÷')}
          className="calc-btn py-3.5 px-3 rounded-xl text-lg font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/70 hover:text-white transition"
        >
          ÷
        </button>

        <button
          onClick={() => appendSymbol(isSecond ? 'phi' : 'e')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          {isSecond ? 'φ' : 'e'}
        </button>

        {/* Row 4 */}
        <button
          onClick={() => appendFunction('factorial')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          n!
        </button>

        <button
          onClick={() => appendSymbol('4')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          4
        </button>

        <button
          onClick={() => appendSymbol('5')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          5
        </button>

        <button
          onClick={() => appendSymbol('6')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          6
        </button>

        <button
          onClick={() => appendOperator('×')}
          className="calc-btn py-3.5 px-3 rounded-xl text-lg font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/70 hover:text-white transition"
        >
          ×
        </button>

        <button
          onClick={() => appendOperator('%')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          %
        </button>

        {/* Row 5 */}
        <button
          onClick={() => appendFunction(isSecond ? 'asinh' : 'sinh')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          sinh
        </button>

        <button
          onClick={() => appendSymbol('1')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          1
        </button>

        <button
          onClick={() => appendSymbol('2')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          2
        </button>

        <button
          onClick={() => appendSymbol('3')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          3
        </button>

        <button
          onClick={() => appendOperator('-')}
          className="calc-btn py-3.5 px-3 rounded-xl text-lg font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/70 hover:text-white transition"
        >
          -
        </button>

        <button
          onClick={() => appendFunction('abs')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          |x|
        </button>

        {/* Row 6 */}
        <button
          onClick={() => appendFunction(isSecond ? 'acosh' : 'cosh')}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
        >
          cosh
        </button>

        <button
          onClick={() => appendSymbol('0')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          0
        </button>

        <button
          onClick={() => appendSymbol('.')}
          className="calc-btn py-3.5 px-3 rounded-xl text-base sm:text-lg font-semibold bg-slate-800/80 text-white border border-slate-700/60 hover:bg-slate-700 transition"
        >
          .
        </button>

        <button
          onClick={handleEquals}
          className="calc-btn py-3.5 px-3 rounded-xl text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition col-span-2 sm:col-span-1"
        >
          =
        </button>

        <button
          onClick={() => appendOperator('+')}
          className="calc-btn py-3.5 px-3 rounded-xl text-lg font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/70 hover:text-white transition"
        >
          +
        </button>

        <button
          onClick={() => {
            if (result && result !== '0') {
              appendSymbol(result);
            }
          }}
          className="calc-btn py-3 px-2 rounded-xl text-xs sm:text-sm font-mono bg-slate-900/90 text-cyan-400 border border-slate-800 hover:bg-slate-800 transition"
          title="Use previous answer"
        >
          ANS
        </button>
      </div>

      {/* Helpful keyboard shortcut hints */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2">
        <span>Keyboard: numbers, operators, Enter (=), Backspace, C (clear)</span>
        <span>Supports Python-style math expressions via FastAPI backend</span>
      </div>
    </div>
  );
};

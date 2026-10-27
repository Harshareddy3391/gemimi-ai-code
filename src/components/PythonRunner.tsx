import React, { useState } from 'react';
import { Terminal, Play, RotateCcw, Clock, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { CalculatorApiService } from '../services/api';
import { PythonExecResponse } from '../types';

const SNIPPETS = [
  {
    name: 'Binomial Coefficients',
    code: '[math.comb(10, k) for k in range(11)]',
    desc: 'Pascal triangle row 10 via math.comb',
  },
  {
    name: 'Euler Basel Series (π²/6)',
    code: 'round(sum(1 / (n**2) for n in range(1, 10000)), 6)',
    desc: 'Approximation to π²/6 ≈ 1.644934',
  },
  {
    name: 'Prime Numbers < 60',
    code: '[p for p in range(2, 60) if all(p % d != 0 for d in range(2, int(p**0.5) + 1))]',
    desc: 'List comprehension sieve',
  },
  {
    name: 'Large Factorial (25!)',
    code: 'math.factorial(25)',
    desc: 'Exact arbitrary-precision integer in Python',
  },
  {
    name: 'Euler Identity (e^(i*pi))',
    code: 'round(cmath.exp(1j * math.pi).real, 4) + round(cmath.exp(1j * math.pi).imag, 4) * 1j',
    desc: 'Complex exponential using cmath',
  },
  {
    name: 'Multi-line Matrix Determinant',
    code: `def det2x2(m):
    return m[0][0]*m[1][1] - m[0][1]*m[1][0]

result = det2x2([[4, 7], [2, 6]])`,
    desc: 'Custom Python function with result assignment',
  },
];

export const PythonRunner: React.FC = () => {
  const [code, setCode] = useState<string>('[math.comb(10, k) for k in range(11)]');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<PythonExecResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRun = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await CalculatorApiService.runPythonCode(code);
      setResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (!response?.repr_str) return;
    navigator.clipboard.writeText(response.repr_str);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Python FastAPI Math Console</h3>
            <p className="text-xs text-slate-400">
              Evaluates code with native Python 3 math, cmath, AST safety and high precision.
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{loading ? 'Executing...' : 'Run Python'}</span>
        </button>
      </div>

      {/* Snippet Presets */}
      <div className="flex items-center overflow-x-auto gap-2 pb-1 scrollbar-none">
        {SNIPPETS.map((s) => (
          <button
            key={s.name}
            onClick={() => {
              setCode(s.code);
              setResponse(null);
            }}
            className="flex flex-col items-start px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 transition text-left whitespace-nowrap"
          >
            <span className="text-xs font-semibold text-cyan-300">{s.name}</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
              {s.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Code Editor and Output Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Python Code Input</span>
            </span>
            <button
              onClick={() => setCode('')}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={10}
            className="w-full bg-[#0a0e17] border border-slate-800 rounded-xl p-3 font-mono text-xs sm:text-sm text-cyan-200 focus:outline-none focus:border-cyan-500/80 leading-relaxed resize-none"
            placeholder="# Enter Python math expression or function..."
          />

          <span className="text-[11px] text-slate-500">
            Available: <code>math</code>, <code>cmath</code>, <code>sum</code>, <code>abs</code>, <code>round</code>, <code>range</code>, <code>list</code>
          </span>
        </div>

        {/* Output */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Execution Output</span>
            </span>
            {response && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {response.execution_time_ms}ms
                </span>
                <button
                  onClick={copyOutput}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Copy output"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <div className="w-full h-full min-h-[220px] bg-[#0a0e17] border border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm flex flex-col justify-between overflow-y-auto">
            {response ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  {response.status === 'success' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: 200 OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Execution Error
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    type: {response.output_type}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border whitespace-pre-wrap select-all font-mono break-all ${
                    response.status === 'success'
                      ? 'bg-slate-900/60 border-cyan-500/20 text-cyan-300'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  }`}
                >
                  {response.repr_str}
                </div>
              </div>
            ) : (
              <div className="text-slate-600 flex flex-col items-center justify-center my-auto py-8">
                <Terminal className="w-8 h-8 opacity-40 mb-2" />
                <span>Click "Run Python" to execute</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, FileCode2, Play, Copy, Check, Terminal, ExternalLink, Database, Server } from 'lucide-react';

interface FastApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FastApiInspectorModal: React.FC<FastApiInspectorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'test' | 'code'>('endpoints');
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/evaluate');
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify({ expression: 'sqrt(144) + sin(pi / 2) * 5', angle_mode: 'rad' }, null, 2)
  );
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestSend = async () => {
    setLoading(true);
    setTestResponse(null);
    try {
      const parsed = JSON.parse(testPayload);
      const res = await fetch(testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyPythonBackendCode = () => {
    navigator.clipboard.writeText(PYTHON_CODE_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#0e1422] border border-slate-800 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white text-base sm:text-lg">FastAPI Python Backend Specs</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  OpenAPI 3.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Architecture, Pydantic schemas, and live REST endpoints powering One Calculator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-900/40 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'endpoints'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            REST Endpoints & Models
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'test'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Interactive API Tester
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'code'
                ? 'border-cyan-500 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Standalone FastAPI Code
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'endpoints' && (
            <div className="flex flex-col gap-3">
              {[
                {
                  method: 'POST',
                  path: '/api/evaluate',
                  desc: 'Evaluates algebraic, trigonometric, and scientific expressions with AST safety',
                  params: 'EvalRequest { expression: str, angle_mode: "deg"|"rad", precision: int }',
                  resp: 'EvalResponse { result: float, formatted: str, engine: str, execution_time_ms: float }'
                },
                {
                  method: 'POST',
                  path: '/api/python/eval',
                  desc: 'Runs native Python 3 math, cmath, series, and list comprehensions',
                  params: 'PythonExecRequest { code: str }',
                  resp: 'PythonExecResponse { result: Any, repr_str: str, output_type: str, execution_time_ms: float }'
                },
                {
                  method: 'POST',
                  path: '/api/matrix/operations',
                  desc: 'Multiplies, inverts, computes determinants, traces, and transposes matrices',
                  params: 'MatrixOpRequest { operation: str, matrixA: List[List[float]], matrixB?: List[List[float]] }',
                  resp: 'MatrixOpResponse { result: List[List[float]] | float, operation: str }'
                },
                {
                  method: 'POST',
                  path: '/api/finance/loan',
                  desc: 'Computes monthly EMI, interest, and full amortization schedule',
                  params: 'LoanRequest { principal: float, annual_rate_percent: float, tenure_years: float }',
                  resp: 'LoanResponse { monthly_emi: float, total_interest: float, schedule_summary: List[Dict] }'
                },
                {
                  method: 'POST',
                  path: '/api/finance/compound',
                  desc: 'Compound interest with periodic deposits and wealth forecast',
                  params: 'CompoundInterestRequest { principal: float, monthly_contribution: float, annual_rate_percent: float, years: int }',
                  resp: 'CompoundResult { final_balance: float, total_deposits: float, total_interest: float, breakdown: List }'
                },
                {
                  method: 'POST',
                  path: '/api/programmer/bitwise',
                  desc: 'Computes bitwise masks, popcount, and multi-base representations (HEX/DEC/OCT/BIN)',
                  params: 'ProgrammerBitwiseRequest { value: int, bit_width: 8|16|32|64 }',
                  resp: 'BitwiseResponse { hex: str, dec: str, oct: str, bin: str, popcount: int }'
                },
                {
                  method: 'POST',
                  path: '/api/convert/unit',
                  desc: 'Converts between Length, Weight, Temperature, Data, and Volume units',
                  params: 'UnitConvertRequest { category: str, from_unit: str, to_unit: str, value: float }',
                  resp: 'UnitResponse { value: float, result: float, from_unit: str, to_unit: str }'
                },
              ].map((ep) => (
                <div key={ep.path} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">{ep.path}</span>
                  </div>
                  <p className="text-xs text-slate-300">{ep.desc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                    <div className="p-2 rounded bg-slate-950/70 border border-slate-800 text-slate-300">
                      <span className="text-slate-500 block mb-0.5">Request Body:</span>
                      {ep.params}
                    </div>
                    <div className="p-2 rounded bg-slate-950/70 border border-slate-800 text-cyan-300">
                      <span className="text-slate-500 block mb-0.5">Response Model:</span>
                      {ep.resp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'test' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={testEndpoint}
                  onChange={(e) => {
                    setTestEndpoint(e.target.value);
                    if (e.target.value === '/api/evaluate') {
                      setTestPayload(JSON.stringify({ expression: 'cos(pi) + sqrt(81)', angle_mode: 'rad' }, null, 2));
                    } else if (e.target.value === '/api/python/eval') {
                      setTestPayload(JSON.stringify({ code: '[x**2 for x in range(10)]' }, null, 2));
                    } else if (e.target.value === '/api/matrix/operations') {
                      setTestPayload(JSON.stringify({ operation: 'det', matrixA: [[1, 2], [3, 4]] }, null, 2));
                    } else if (e.target.value === '/api/finance/loan') {
                      setTestPayload(JSON.stringify({ principal: 250000, annual_rate_percent: 6.5, tenure_years: 30 }, null, 2));
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none w-full sm:w-auto"
                >
                  <option value="/api/evaluate">POST /api/evaluate</option>
                  <option value="/api/python/eval">POST /api/python/eval</option>
                  <option value="/api/matrix/operations">POST /api/matrix/operations</option>
                  <option value="/api/finance/loan">POST /api/finance/loan</option>
                </select>

                <button
                  onClick={handleTestSend}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>Send Request</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono text-slate-400 font-semibold">JSON Request Payload:</span>
                  <textarea
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    rows={8}
                    className="w-full bg-[#0a0e17] border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono text-slate-400 font-semibold">Live JSON Response:</span>
                  <pre className="w-full h-full min-h-[170px] bg-[#0a0e17] border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 overflow-auto select-all leading-relaxed">
                    {testResponse || '// Click Send Request to inspect response'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Located in: <code>/backend/main.py</code>
                </span>
                <button
                  onClick={copyPythonBackendCode}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="bg-[#0a0e17] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[420px] select-all leading-relaxed">
                {PYTHON_CODE_SNIPPET}
              </pre>

              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex flex-col gap-1">
                <span className="font-semibold text-white">How to run standalone:</span>
                <code>1. pip install -r backend/requirements.txt</code>
                <code>2. uvicorn backend.main:app --reload --port 8000</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PYTHON_CODE_SNIPPET = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import math, cmath, ast, time

app = FastAPI(title="One Calculator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvalRequest(BaseModel):
    expression: str
    angle_mode: Optional[str] = "deg"
    precision: Optional[int] = 10

@app.post("/api/evaluate")
def evaluate_math(req: EvalRequest):
    t0 = time.perf_counter()
    safe_env = {
        "sin": math.sin if req.angle_mode == "rad" else lambda x: math.sin(math.radians(x)),
        "cos": math.cos if req.angle_mode == "rad" else lambda x: math.cos(math.radians(x)),
        "tan": math.tan if req.angle_mode == "rad" else lambda x: math.tan(math.radians(x)),
        "sqrt": math.sqrt, "log": math.log10, "ln": math.log,
        "pi": math.pi, "e": math.e, "factorial": math.factorial
    }
    expr = req.expression.replace("^", "**").replace("×", "*").replace("÷", "/")
    val = eval(compile(ast.parse(expr, mode='eval'), "<calc>", "eval"), {"__builtins__": {}}, safe_env)
    return {
        "result": val,
        "formatted": f"{val:.{req.precision}g}" if isinstance(val, (int, float)) else str(val),
        "execution_time_ms": round((time.perf_counter() - t0) * 1000, 3)
    }
`;

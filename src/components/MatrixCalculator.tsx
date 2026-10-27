import React, { useState } from 'react';
import { Grid3X3, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';
import { CalculatorApiService } from '../services/api';

type MatrixDim = 2 | 3 | 4;

export const MatrixCalculator: React.FC = () => {
  const [dim, setDim] = useState<MatrixDim>(3);

  const createInitialMatrix = (size: number, isIdentity = false) => {
    return Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => (isIdentity && r === c ? 1 : (r * size + c + 1)))
    );
  };

  const [matrixA, setMatrixA] = useState<number[][]>(() => createInitialMatrix(3));
  const [matrixB, setMatrixB] = useState<number[][]>(() => createInitialMatrix(3, true));
  const [result, setResult] = useState<any>(null);
  const [opLabel, setOpLabel] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const changeDimension = (newDim: MatrixDim) => {
    setDim(newDim);
    setMatrixA(createInitialMatrix(newDim));
    setMatrixB(createInitialMatrix(newDim, true));
    setResult(null);
    setOpLabel('');
    setErrorMsg(null);
  };

  const handleCellChange = (matrix: 'A' | 'B', r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (matrix === 'A') {
      const next = matrixA.map((row, rowIdx) =>
        rowIdx === r ? row.map((cell, colIdx) => (colIdx === c ? num : cell)) : row
      );
      setMatrixA(next);
    } else {
      const next = matrixB.map((row, rowIdx) =>
        rowIdx === r ? row.map((cell, colIdx) => (colIdx === c ? num : cell)) : row
      );
      setMatrixB(next);
    }
  };

  const executeOp = async (op: string, label: string) => {
    setLoading(true);
    setErrorMsg(null);
    setOpLabel(label);

    try {
      const res = await CalculatorApiService.matrixOp(op, matrixA, ['add', 'subtract', 'multiply'].includes(op) ? matrixB : undefined);
      setResult(res.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Matrix operation error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (target: 'A' | 'B', type: 'identity' | 'zero' | 'random') => {
    let next: number[][];
    if (type === 'identity') {
      next = createInitialMatrix(dim, true);
    } else if (type === 'zero') {
      next = Array.from({ length: dim }, () => Array.from({ length: dim }, () => 0));
    } else {
      next = Array.from({ length: dim }, () =>
        Array.from({ length: dim }, () => Math.floor(Math.random() * 9) - 4)
      );
    }
    if (target === 'A') setMatrixA(next);
    else setMatrixB(next);
  };

  const transferResultToA = () => {
    if (Array.isArray(result) && Array.isArray(result[0])) {
      setMatrixA(result);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">
      {/* Dimension Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Matrix Dimension</span>
        </div>
        <div className="flex items-center gap-1.5">
          {([2, 3, 4] as MatrixDim[]).map((d) => (
            <button
              key={d}
              onClick={() => changeDimension(d)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                dim === d
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d} × {d}
            </button>
          ))}
        </div>
      </div>

      {/* Matrices A and B Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* MATRIX A */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-cyan-300 flex items-center gap-1.5">
              <span>Matrix A</span>
              <span className="text-xs text-slate-500 font-mono">({dim}x{dim})</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreset('A', 'identity')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Identity
              </button>
              <button
                onClick={() => setPreset('A', 'zero')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Zero
              </button>
              <button
                onClick={() => setPreset('A', 'random')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Random
              </button>
            </div>
          </div>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
          >
            {matrixA.map((row, r) =>
              row.map((cell, c) => (
                <input
                  key={`a-${r}-${c}`}
                  type="number"
                  value={cell}
                  onChange={(e) => handleCellChange('A', r, c, e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-2 text-center font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              ))
            )}
          </div>
        </div>

        {/* MATRIX B */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-indigo-300 flex items-center gap-1.5">
              <span>Matrix B</span>
              <span className="text-xs text-slate-500 font-mono">({dim}x{dim})</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreset('B', 'identity')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Identity
              </button>
              <button
                onClick={() => setPreset('B', 'zero')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Zero
              </button>
              <button
                onClick={() => setPreset('B', 'random')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Random
              </button>
            </div>
          </div>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}
          >
            {matrixB.map((row, r) =>
              row.map((cell, c) => (
                <input
                  key={`b-${r}-${c}`}
                  type="number"
                  value={cell}
                  onChange={(e) => handleCellChange('B', r, c, e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-2 text-center font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operations Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => executeOp('add', 'A + B')}
          className="calc-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-white hover:bg-cyan-600 transition"
        >
          A + B
        </button>
        <button
          onClick={() => executeOp('subtract', 'A - B')}
          className="calc-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-white hover:bg-cyan-600 transition"
        >
          A - B
        </button>
        <button
          onClick={() => executeOp('multiply', 'A × B')}
          className="calc-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition shadow-sm"
        >
          A × B
        </button>
        <div className="w-[1px] h-8 bg-slate-800 mx-1 hidden sm:block" />
        <button
          onClick={() => executeOp('det', 'det(A)')}
          className="calc-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-medium bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white transition"
        >
          det(A)
        </button>
        <button
          onClick={() => executeOp('inverse', 'A⁻¹')}
          className="calc-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-medium bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white transition"
        >
          A⁻¹ (Inverse)
        </button>
        <button
          onClick={() => executeOp('transpose', 'Aᵀ')}
          className="calc-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-medium bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white transition"
        >
          Aᵀ (Transpose)
        </button>
        <button
          onClick={() => executeOp('trace', 'tr(A)')}
          className="calc-btn px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-medium bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white transition"
        >
          tr(A) (Trace)
        </button>
      </div>

      {/* Result Display Box */}
      {(result !== null || errorMsg) && (
        <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 shadow-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Result: <strong className="text-cyan-400">{opLabel}</strong>
            </span>
            <div className="flex items-center gap-2">
              {Array.isArray(result) && (
                <button
                  onClick={transferResultToA}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 transition"
                  title="Copy result matrix into Matrix A"
                >
                  Use as Matrix A
                </button>
              )}
            </div>
          </div>

          {errorMsg ? (
            <div className="text-rose-400 text-sm font-mono p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl">
              {errorMsg}
            </div>
          ) : typeof result === 'number' ? (
            <div className="font-mono text-3xl font-bold text-white text-center py-4">
              {Math.round(result * 1e8) / 1e8}
            </div>
          ) : Array.isArray(result) ? (
            <div
              className="grid gap-2 max-w-sm mx-auto w-full py-2"
              style={{ gridTemplateColumns: `repeat(${result[0]?.length || dim}, minmax(0, 1fr))` }}
            >
              {result.map((row: any[], r: number) =>
                row.map((cell: any, c: number) => (
                  <div
                    key={`res-${r}-${c}`}
                    className="bg-slate-900/90 border border-cyan-500/40 rounded-xl py-2 px-2 text-center font-mono text-sm text-cyan-300 font-semibold select-all"
                  >
                    {typeof cell === 'number' ? Math.round(cell * 1e4) / 1e4 : cell}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

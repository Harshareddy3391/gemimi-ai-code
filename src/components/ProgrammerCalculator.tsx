import React, { useState, useEffect } from 'react';
import { Binary, Delete, Hash, Copy, Check } from 'lucide-react';
import { CalculatorApiService } from '../services/api';

type BitWidth = 64 | 32 | 16 | 8;
type ActiveBase = 'HEX' | 'DEC' | 'OCT' | 'BIN';

export const ProgrammerCalculator: React.FC = () => {
  const [value, setValue] = useState<bigint>(42n);
  const [bitWidth, setBitWidth] = useState<BitWidth>(32);
  const [activeBase, setActiveBase] = useState<ActiveBase>('DEC');
  const [copiedBase, setCopiedBase] = useState<string | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [storedVal, setStoredVal] = useState<bigint | null>(null);

  // Bit mask for current width
  const mask = (1n << BigInt(bitWidth)) - 1n;
  const currentVal = value & mask;

  // Format strings
  const hexStr = currentVal.toString(16).toUpperCase().padStart(bitWidth / 4, '0');
  const decStr = currentVal.toString(10);
  const octStr = currentVal.toString(8);
  const binStr = currentVal.toString(2).padStart(bitWidth, '0');
  const popCount = (binStr.match(/1/g) || []).length;

  const copyToClipboard = (text: string, base: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBase(base);
    setTimeout(() => setCopiedBase(null), 1500);
  };

  const handleInputDigit = (digit: string) => {
    let currentStr = '';
    if (activeBase === 'HEX') currentStr = currentVal.toString(16);
    else if (activeBase === 'DEC') currentStr = currentVal.toString(10);
    else if (activeBase === 'OCT') currentStr = currentVal.toString(8);
    else if (activeBase === 'BIN') currentStr = currentVal.toString(2);

    if (currentStr === '0') currentStr = '';
    const newStr = currentStr + digit;

    try {
      let parsed = 0n;
      if (activeBase === 'HEX') parsed = BigInt('0x' + newStr);
      else if (activeBase === 'DEC') parsed = BigInt(newStr);
      else if (activeBase === 'OCT') parsed = BigInt('0o' + newStr);
      else if (activeBase === 'BIN') parsed = BigInt('0b' + newStr);
      setValue(parsed & mask);
    } catch (e) {}
  };

  const handleBackspace = () => {
    let currentStr = '';
    if (activeBase === 'HEX') currentStr = currentVal.toString(16);
    else if (activeBase === 'DEC') currentStr = currentVal.toString(10);
    else if (activeBase === 'OCT') currentStr = currentVal.toString(8);
    else if (activeBase === 'BIN') currentStr = currentVal.toString(2);

    if (currentStr.length <= 1) {
      setValue(0n);
      return;
    }
    const newStr = currentStr.slice(0, -1);
    try {
      let parsed = 0n;
      if (activeBase === 'HEX') parsed = BigInt('0x' + newStr);
      else if (activeBase === 'DEC') parsed = BigInt(newStr);
      else if (activeBase === 'OCT') parsed = BigInt('0o' + newStr);
      else if (activeBase === 'BIN') parsed = BigInt('0b' + newStr);
      setValue(parsed & mask);
    } catch (e) {
      setValue(0n);
    }
  };

  const toggleBit = (bitIndex: number) => {
    const bitMask = 1n << BigInt(bitIndex);
    setValue((currentVal ^ bitMask) & mask);
  };

  const applyBitwiseUnary = (op: string) => {
    if (op === 'NOT') {
      setValue((~currentVal) & mask);
    } else if (op === 'LSH1') {
      setValue((currentVal << 1n) & mask);
    } else if (op === 'RSH1') {
      setValue((currentVal >> 1n) & mask);
    } else if (op === 'ROL') {
      const msb = (currentVal >> BigInt(bitWidth - 1)) & 1n;
      setValue(((currentVal << 1n) | msb) & mask);
    } else if (op === 'ROR') {
      const lsb = currentVal & 1n;
      setValue(((currentVal >> 1n) | (lsb << BigInt(bitWidth - 1))) & mask);
    } else if (op === 'NEG') {
      setValue((-currentVal) & mask);
    }
  };

  const setBinaryOp = (op: string) => {
    setStoredVal(currentVal);
    setPendingOp(op);
    setValue(0n);
  };

  const executeBinaryOp = () => {
    if (storedVal === null || !pendingOp) return;
    const a = storedVal;
    const b = currentVal;
    let res = 0n;

    if (pendingOp === 'AND') res = a & b;
    else if (pendingOp === 'OR') res = a | b;
    else if (pendingOp === 'XOR') res = a ^ b;
    else if (pendingOp === 'NAND') res = ~(a & b);
    else if (pendingOp === 'NOR') res = ~(a | b);
    else if (pendingOp === 'SHL') res = a << b;
    else if (pendingOp === 'SHR') res = a >> b;
    else if (pendingOp === '+') res = a + b;
    else if (pendingOp === '-') res = a - b;
    else if (pendingOp === '*') res = a * b;
    else if (pendingOp === '/') res = b !== 0n ? a / b : 0n;

    setValue(res & mask);
    setStoredVal(null);
    setPendingOp(null);
  };

  // Keyboard hex enablement
  const isHexDigitDisabled = (char: string) => {
    if (activeBase === 'HEX') return false;
    if (activeBase === 'DEC') return !/^[0-9]$/.test(char);
    if (activeBase === 'OCT') return !/^[0-7]$/.test(char);
    if (activeBase === 'BIN') return !/^[0-1]$/.test(char);
    return true;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Bit Width Selector */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-3">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase text-slate-300">Word Size</span>
        </div>
        <div className="flex items-center gap-1">
          {([64, 32, 16, 8] as BitWidth[]).map((w) => (
            <button
              key={w}
              onClick={() => setBitWidth(w)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                bitWidth === w
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {w === 64 ? 'QWORD (64)' : w === 32 ? 'DWORD (32)' : w === 16 ? 'WORD (16)' : 'BYTE (8)'}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Base Values Display */}
      <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800/90 shadow-xl p-4 sm:p-5 flex flex-col gap-2.5">
        {[
          { base: 'HEX', label: 'HEX', val: hexStr, prefix: '0x' },
          { base: 'DEC', label: 'DEC', val: decStr, prefix: '' },
          { base: 'OCT', label: 'OCT', val: octStr, prefix: '0o' },
          { base: 'BIN', label: 'BIN', val: binStr, prefix: '' },
        ].map((item) => {
          const isActive = activeBase === item.base;
          return (
            <div
              key={item.base}
              onClick={() => setActiveBase(item.base as ActiveBase)}
              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold w-10 px-1.5 py-0.5 rounded text-center ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
                <span className="font-mono text-sm sm:text-lg tracking-wider break-all select-all">
                  {item.prefix}
                  {item.base === 'BIN'
                    ? item.val.replace(/(.{4})/g, '$1 ').trim()
                    : item.val}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item.val, item.base);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Copy value"
              >
                {copiedBase === item.base ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Bit-Toggling Grid */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            Interactive Bit Toggler (Click any bit to flip)
          </span>
          <span className="text-xs font-mono text-cyan-400">
            Popcount (1s): <strong className="text-white">{popCount}</strong> / {bitWidth}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center py-1">
          {Array.from({ length: bitWidth }, (_, i) => {
            const bitIndex = bitWidth - 1 - i;
            const isSet = (currentVal & (1n << BigInt(bitIndex))) !== 0n;
            return (
              <button
                key={bitIndex}
                onClick={() => toggleBit(bitIndex)}
                title={`Bit ${bitIndex}`}
                className={`flex flex-col items-center justify-center w-6 sm:w-8 h-9 sm:h-10 rounded-lg text-xs font-mono font-semibold transition border ${
                  isSet
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{isSet ? '1' : '0'}</span>
                <span className="text-[9px] opacity-60 font-sans">{bitIndex}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bitwise Ops & Number Pad */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {/* Unary & Binary Bitwise */}
        <button
          onClick={() => applyBitwiseUnary('NOT')}
          className="calc-btn py-3 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
        >
          NOT (~)
        </button>
        <button
          onClick={() => setBinaryOp('AND')}
          className="calc-btn py-3 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
        >
          AND (&)
        </button>
        <button
          onClick={() => setBinaryOp('OR')}
          className="calc-btn py-3 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
        >
          OR (|)
        </button>
        <button
          onClick={() => setBinaryOp('XOR')}
          className="calc-btn py-3 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
        >
          XOR (^)
        </button>
        <button
          onClick={() => applyBitwiseUnary('LSH1')}
          className="calc-btn py-3 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
        >
          LSH (&lt;&lt;)
        </button>
        <button
          onClick={() => applyBitwiseUnary('RSH1')}
          className="calc-btn py-3 rounded-xl text-xs sm:text-sm font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400"
        >
          RSH (&gt;&gt;)
        </button>

        {/* Row 2: Hex Digits A-F */}
        {['A', 'B', 'C', 'D', 'E', 'F'].map((hex) => {
          const disabled = isHexDigitDisabled(hex);
          return (
            <button
              key={hex}
              disabled={disabled}
              onClick={() => handleInputDigit(hex)}
              className="calc-btn py-3 rounded-xl text-sm font-mono font-bold bg-slate-800/60 text-cyan-300 border border-slate-700/60 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none transition"
            >
              {hex}
            </button>
          );
        })}

        {/* Numbers 7,8,9, Clear, Backspace */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            disabled={isHexDigitDisabled(d)}
            onClick={() => handleInputDigit(d)}
            className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setValue(0n)}
          className="calc-btn py-3.5 rounded-xl text-sm font-semibold bg-rose-950/40 text-rose-300 border border-rose-900/50 hover:bg-rose-900"
        >
          CLR
        </button>
        <button
          onClick={handleBackspace}
          className="calc-btn py-3.5 rounded-xl flex items-center justify-center bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBinaryOp('+')}
          className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900"
        >
          +
        </button>

        {/* Numbers 4,5,6 */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            disabled={isHexDigitDisabled(d)}
            onClick={() => handleInputDigit(d)}
            className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setBinaryOp('-')}
          className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900"
        >
          -
        </button>
        <button
          onClick={() => setBinaryOp('*')}
          className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900"
        >
          ×
        </button>
        <button
          onClick={() => setBinaryOp('/')}
          className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900"
        >
          ÷
        </button>

        {/* Numbers 1,2,3, 0, Equals */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            disabled={isHexDigitDisabled(d)}
            onClick={() => handleInputDigit(d)}
            className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleInputDigit('0')}
          className="calc-btn py-3.5 rounded-xl text-base font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
        >
          0
        </button>
        <button
          onClick={executeBinaryOp}
          className="calc-btn py-3.5 rounded-xl text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 col-span-2"
        >
          =
        </button>
      </div>
    </div>
  );
};

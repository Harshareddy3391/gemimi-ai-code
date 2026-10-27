import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, ZoomIn, ZoomOut, RefreshCw, Play, Info } from 'lucide-react';
import * as math from 'mathjs';

const PRESETS = [
  { label: 'sin(x)', formula: 'sin(x)' },
  { label: 'x² - 4', formula: 'x^2 - 4' },
  { label: 'x³ - 3x', formula: 'x^3 - 3*x' },
  { label: 'e⁻ˣ · cos(3x)', formula: 'exp(-x/3) * cos(3*x)' },
  { label: 'tan(x)', formula: 'tan(x)' },
  { label: '1 / x', formula: '1 / x' },
];

export const GraphingCalculator: React.FC = () => {
  const [formula, setFormula] = useState<string>('sin(x) * x / 2');
  const [scale, setScale] = useState<number>(40); // pixels per unit
  const [originOffset, setOriginOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [parseError, setParseError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw graph on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2 + originOffset.x;
    const originY = height / 2 + originOffset.y;

    // Clear background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Vertical grid
    const leftUnit = Math.floor(-originX / scale);
    const rightUnit = Math.ceil((width - originX) / scale);
    for (let u = leftUnit; u <= rightUnit; u++) {
      const px = originX + u * scale;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      if (u !== 0 && scale >= 25) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(String(u), px + 3, originY - 4);
      }
    }

    // Horizontal grid
    const topUnit = Math.ceil(originY / scale);
    const bottomUnit = Math.floor((originY - height) / scale);
    for (let u = bottomUnit; u <= topUnit; u++) {
      const py = originY - u * scale;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      if (u !== 0 && scale >= 25) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(String(u), originX + 4, py - 3);
      }
    }

    // Main Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Compile function
    let compiled: any;
    try {
      const clean = formula.replace(/×/g, '*').replace(/÷/g, '/');
      compiled = math.compile(clean);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message || 'Syntax error');
      return;
    }

    // Plot Curve f(x)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    const step = 2; // step in pixels

    for (let px = 0; px <= width; px += step) {
      const xVal = (px - originX) / scale;
      try {
        const yVal = compiled.evaluate({ x: xVal });
        if (typeof yVal === 'number' && !isNaN(yVal) && isFinite(yVal)) {
          const py = originY - yVal * scale;
          if (py >= -100 && py <= height + 100) {
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            started = false;
          }
        } else {
          started = false;
        }
      } catch (e) {
        started = false;
      }
    }
    ctx.stroke();

    // Draw Crosshair if hovering
    if (hoverCoord) {
      const hpx = originX + hoverCoord.x * scale;
      const hpy = originY - hoverCoord.y * scale;

      ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hpx, 0);
      ctx.lineTo(hpx, height);
      ctx.moveTo(0, hpy);
      ctx.lineTo(width, hpy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(hpx, hpy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [formula, scale, originOffset, hoverCoord]);

  // Handle canvas resize & redraw
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || 700;
      canvas.height = 420;
      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - originOffset.x, y: e.clientY - originOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setOriginOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    const originX = canvas.width / 2 + originOffset.x;
    const originY = canvas.height / 2 + originOffset.y;
    const mathX = (mouseX - originX) / scale;

    try {
      const compiled = math.compile(formula);
      const mathY = compiled.evaluate({ x: mathX });
      if (typeof mathY === 'number' && !isNaN(mathY) && isFinite(mathY)) {
        setHoverCoord({ x: mathX, y: mathY });
      } else {
        setHoverCoord(null);
      }
    } catch {
      setHoverCoord(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(40);
    setOriginOffset({ x: 0, y: 0 });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Formula Input Bar */}
      <div className="bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-mono text-cyan-400 font-bold text-lg">f(x) =</span>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            className="flex-1 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white text-sm focus:outline-none focus:border-cyan-500"
            placeholder="e.g. sin(x) + cos(2*x)"
          />
        </div>

        {/* Preset chips */}
        <div className="flex items-center overflow-x-auto gap-1.5 w-full sm:w-auto scrollbar-none">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setFormula(p.formula)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-xl p-3">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-[#0a0e17] shadow-xl">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoverCoord(null);
          }}
          className="w-full block cursor-crosshair select-none"
        />

        {/* On-Canvas Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => setScale((s) => Math.min(200, s * 1.25))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(10, s / 1.25))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Hover Coordinate Tag */}
        {hoverCoord && (
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs shadow-lg flex items-center gap-2">
            <span className="text-cyan-400">x: {hoverCoord.x.toFixed(3)}</span>
            <span className="text-pink-400">f(x): {hoverCoord.y.toFixed(3)}</span>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 text-center">
        Tip: Drag on canvas to pan • Use zoom buttons to inspect curves • Move cursor over curve to read coordinates
      </div>
    </div>
  );
};

import * as math from 'mathjs';
import { AngleMode, CompoundResult, EvalResponse, HistoryItem, LoanResult, PythonExecResponse } from '../types';

export class CalculatorApiService {
  private static backendAvailable: boolean = true;
  private static lastPingTime: number = 0;

  static async checkHealth(): Promise<{ ok: boolean; service?: string; latency?: number }> {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        this.backendAvailable = true;
        this.lastPingTime = Math.round(performance.now() - t0);
        return { ok: true, service: data.service, latency: this.lastPingTime };
      }
    } catch (e) {
      this.backendAvailable = false;
    }
    return { ok: false, latency: Math.round(performance.now() - t0) };
  }

  static async evaluate(
    expression: string,
    angleMode: AngleMode = 'deg',
    precision: number = 10,
    engine: 'auto' | 'python' | 'client' = 'auto'
  ): Promise<EvalResponse> {
    const t0 = performance.now();

    // Client-only requested
    if (engine === 'client') {
      return this.evaluateClient(expression, angleMode, precision, t0);
    }

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression,
          angle_mode: angleMode,
          precision,
          engine
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      const errData = await response.json().catch(() => ({ detail: 'Calculation error' }));
      throw new Error(errData.detail || 'Calculation error');
    } catch (err: any) {
      if (engine === 'python') {
        return {
          result: null,
          formatted: 'Error',
          expression,
          engine: 'FastAPI Python Engine',
          execution_time_ms: Math.round(performance.now() - t0),
          status: 'error',
          detail: err.message
        };
      }
      // Fallback to client mathjs evaluation
      return this.evaluateClient(expression, angleMode, precision, t0);
    }
  }

  private static evaluateClient(
    expression: string,
    angleMode: AngleMode,
    precision: number,
    t0: number
  ): EvalResponse {
    try {
      let scope: Record<string, any> = {};
      if (angleMode === 'deg') {
        scope = {
          sin: (x: number) => Math.sin((x * Math.PI) / 180),
          cos: (x: number) => Math.cos((x * Math.PI) / 180),
          tan: (x: number) => Math.tan((x * Math.PI) / 180),
          asin: (x: number) => (Math.asin(x) * 180) / Math.PI,
          acos: (x: number) => (Math.acos(x) * 180) / Math.PI,
          atan: (x: number) => (Math.atan(x) * 180) / Math.PI,
        };
      }
      const cleanExpr = expression.replace(/×/g, '*').replace(/÷/g, '/');
      const evaluated = math.evaluate(cleanExpr, scope);
      const formatted = math.format(evaluated, { precision });

      return {
        result: evaluated,
        formatted,
        expression,
        engine: 'Math.js (Client Engine)',
        execution_time_ms: Math.round(performance.now() - t0),
        status: 'success'
      };
    } catch (err: any) {
      return {
        result: null,
        formatted: 'Error',
        expression,
        engine: 'Math.js (Client Engine)',
        execution_time_ms: Math.round(performance.now() - t0),
        status: 'error',
        detail: err.message
      };
    }
  }

  static async runPythonCode(code: string): Promise<PythonExecResponse> {
    const t0 = performance.now();
    try {
      const response = await fetch('/api/python/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        return await response.json();
      }
      const err = await response.json().catch(() => ({ detail: 'Python runner error' }));
      return {
        result: null,
        repr_str: err.detail || 'Execution error',
        output_type: 'error',
        execution_time_ms: Math.round(performance.now() - t0),
        status: 'error'
      };
    } catch (e: any) {
      return {
        result: null,
        repr_str: e.message || 'Network error communicating with Python backend',
        output_type: 'network_error',
        execution_time_ms: Math.round(performance.now() - t0),
        status: 'error'
      };
    }
  }

  static async matrixOp(
    operation: string,
    matrixA: number[][],
    matrixB?: number[][]
  ): Promise<any> {
    const response = await fetch('/api/matrix/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, matrixA, matrixB })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Matrix computation failed' }));
      throw new Error(err.detail);
    }
    return await response.json();
  }

  static async calculateLoan(
    principal: number,
    annual_rate_percent: number,
    tenure_years: number,
    extra_monthly_payment: number = 0
  ): Promise<LoanResult> {
    const res = await fetch('/api/finance/loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal,
        annual_rate_percent,
        tenure_years,
        extra_monthly_payment
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Loan computation failed' }));
      throw new Error(err.detail);
    }
    return await res.json();
  }

  static async calculateCompound(
    principal: number,
    monthly_contribution: number,
    annual_rate_percent: number,
    years: number
  ): Promise<CompoundResult> {
    const res = await fetch('/api/finance/compound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal,
        monthly_contribution,
        annual_rate_percent,
        years
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Compound interest computation failed' }));
      throw new Error(err.detail);
    }
    return await res.json();
  }

  static async convertUnit(
    category: string,
    from_unit: string,
    to_unit: string,
    value: number
  ): Promise<{ result: number }> {
    const res = await fetch('/api/convert/unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, from_unit, to_unit, value })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unit conversion failed' }));
      throw new Error(err.detail);
    }
    return await res.json();
  }

  static async getBitwise(value: number, bit_width: number = 32): Promise<any> {
    const res = await fetch('/api/programmer/bitwise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, bit_width })
    });
    if (!res.ok) throw new Error('Bitwise failed');
    return await res.json();
  }

  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const res = await fetch('/api/history');
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  }

  static async clearHistory(): Promise<void> {
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (e) {}
  }
}

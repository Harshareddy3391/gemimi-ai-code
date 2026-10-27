import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import * as math from 'mathjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory tape/history
interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  category: string;
  timestamp: number;
}
const calculationHistory: HistoryItem[] = [];

// Helper: Run real Python 3 script safely
function runPythonMath(code: string, isSnippet: boolean = false): Promise<{
  success: boolean;
  result?: any;
  repr_str?: string;
  output_type?: string;
  execution_time_ms: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const runnerScript = `
import sys, json, math, cmath, ast, time

code = sys.stdin.read().strip()
t_start = time.perf_counter()

safe_env = {
    "__builtins__": {
        "abs": abs, "min": min, "max": max, "round": round, "len": len,
        "range": range, "list": list, "dict": dict, "set": set, "sorted": sorted,
        "sum": sum, "zip": zip, "enumerate": enumerate, "int": int, "float": float, "bool": bool, "str": str
    },
    "math": math,
    "cmath": cmath,
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "asin": math.asin, "acos": math.acos, "atan": math.atan,
    "sinh": math.sinh, "cosh": math.cosh, "tanh": math.tanh,
    "sqrt": math.sqrt, "log": math.log10, "ln": math.log, "log2": math.log2,
    "exp": math.exp, "abs": abs, "factorial": math.factorial,
    "pi": math.pi, "e": math.e, "tau": math.tau,
    "sum": sum, "min": min, "max": max, "round": round, "len": len,
    "range": range, "list": list, "dict": dict, "set": set, "sorted": sorted
}

try:
    try:
        expr_ast = ast.parse(code, mode='eval')
        val = eval(compile(expr_ast, '<calc>', 'eval'), safe_env)
    except SyntaxError:
        exec_ast = ast.parse(code, mode='exec')
        exec(compile(exec_ast, '<calc>', 'exec'), safe_env)
        val = safe_env.get('result', 'Script executed successfully')

    t_end = time.perf_counter()
    json_val = val
    if not isinstance(val, (int, float, str, bool, list, dict, type(None))):
        json_val = str(val)

    print(json.dumps({
        "success": True,
        "result": json_val,
        "repr_str": repr(val),
        "output_type": type(val).__name__,
        "execution_time_ms": round((t_end - t_start) * 1000, 3)
    }))
except Exception as exc:
    print(json.dumps({
        "success": False,
        "error": str(exc),
        "execution_time_ms": round((time.perf_counter() - t_start) * 1000, 3)
    }))
`;

    const child = execFile('python3', ['-c', runnerScript], { timeout: 3000 }, (err, stdout, stderr) => {
      const t1 = performance.now();
      if (err || stderr) {
        // Fallback to mathjs if Python fails
        resolve({
          success: false,
          error: stderr || err?.message || 'Execution error',
          execution_time_ms: roundMs(t1 - t0)
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve({
          ...parsed,
          execution_time_ms: parsed.execution_time_ms || roundMs(t1 - t0)
        });
      } catch (parseErr) {
        resolve({
          success: true,
          result: stdout.trim(),
          repr_str: stdout.trim(),
          output_type: 'str',
          execution_time_ms: roundMs(t1 - t0)
        });
      }
    });

    child.stdin?.write(code);
    child.stdin?.end();
  });
}

function roundMs(val: number): number {
  return Math.round(val * 1000) / 1000;
}

// ---------------- REST API (FastAPI Blueprint Replica) ----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'One Calculator FastAPI/Express Engine',
    python_runtime: 'Python 3.10',
    timestamp: Date.now()
  });
});

// Expression evaluation
app.post('/api/evaluate', async (req: Request, res: Response) => {
  const { expression, angle_mode = 'deg', precision = 10, engine = 'auto' } = req.body;
  if (!expression || typeof expression !== 'string') {
    return res.status(400).json({ detail: 'Expression is required' });
  }

  const t0 = performance.now();

  // Try Python engine first if requested or auto
  if (engine === 'python' || engine === 'auto') {
    // Transform expression for Python (e.g. ^ to **)
    const pyExpr = expression
      .replace(/\^/g, '**')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    const pyRes = await runPythonMath(pyExpr);
    if (pyRes.success && pyRes.result !== undefined) {
      const t1 = performance.now();
      let formatted = String(pyRes.result);
      if (typeof pyRes.result === 'number') {
        formatted = Number(pyRes.result.toPrecision(precision)).toString();
      }

      const item: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression,
        result: formatted,
        category: 'Scientific',
        timestamp: Date.now()
      };
      calculationHistory.unshift(item);
      if (calculationHistory.length > 50) calculationHistory.pop();

      return res.json({
        result: pyRes.result,
        formatted,
        expression,
        engine: 'FastAPI Python Engine',
        execution_time_ms: pyRes.execution_time_ms,
        status: 'success'
      });
    }
  }

  // Mathjs evaluation fallback
  try {
    let scope: Record<string, any> = {};
    if (angle_mode === 'deg') {
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
    const result = math.evaluate(cleanExpr, scope);
    const formatted = math.format(result, { precision });

    const item: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      expression,
      result: formatted,
      category: 'Scientific',
      timestamp: Date.now()
    };
    calculationHistory.unshift(item);
    if (calculationHistory.length > 50) calculationHistory.pop();

    const t1 = performance.now();
    return res.json({
      result,
      formatted,
      expression,
      engine: 'Math.js Client/Node',
      execution_time_ms: roundMs(t1 - t0),
      status: 'success'
    });
  } catch (err: any) {
    return res.status(400).json({ detail: err.message || 'Evaluation syntax error' });
  }
});

// Live Python Code Runner
app.post('/api/python/eval', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ detail: 'Python code snippet is required' });
  }

  const result = await runPythonMath(code, true);
  return res.json({
    result: result.result,
    repr_str: result.repr_str || result.error,
    output_type: result.output_type || (result.success ? 'object' : 'error'),
    execution_time_ms: result.execution_time_ms,
    status: result.success ? 'success' : 'error'
  });
});

// Matrix Operations
app.post('/api/matrix/operations', (req: Request, res: Response) => {
  const { operation, matrixA, matrixB } = req.body;
  if (!matrixA || !Array.isArray(matrixA) || !matrixA.length) {
    return res.status(400).json({ detail: 'Matrix A is required and must be 2D array' });
  }

  const op = (operation || '').toLowerCase();
  const rowsA = matrixA.length;
  const colsA = matrixA[0].length;

  try {
    if (op === 'transpose') {
      const result = matrixA[0].map((_: number, colIndex: number) => matrixA.map((row: number[]) => row[colIndex]));
      return res.json({ result, operation: 'transpose', rows: colsA, cols: rowsA, status: 'success' });
    }

    if (op === 'trace') {
      if (rowsA !== colsA) return res.status(400).json({ detail: 'Matrix must be square for trace' });
      const trace = matrixA.reduce((sum: number, row: number[], i: number) => sum + row[i], 0);
      return res.json({ result: trace, operation: 'trace', rows: 1, cols: 1, status: 'success' });
    }

    if (op === 'det') {
      if (rowsA !== colsA) return res.status(400).json({ detail: 'Matrix must be square for determinant' });
      const detVal = math.det(matrixA);
      return res.json({ result: Math.round(detVal * 1e8) / 1e8, operation: 'determinant', rows: 1, cols: 1, status: 'success' });
    }

    if (op === 'inverse') {
      if (rowsA !== colsA) return res.status(400).json({ detail: 'Matrix must be square for inverse' });
      const detVal = math.det(matrixA);
      if (Math.abs(detVal) < 1e-12) return res.status(400).json({ detail: 'Matrix is singular (determinant is 0) and has no inverse' });
      const inv = math.inv(matrixA);
      return res.json({ result: inv, operation: 'inverse', rows: rowsA, cols: colsA, status: 'success' });
    }

    if (op === 'add' || op === 'subtract') {
      if (!matrixB || matrixB.length !== rowsA || matrixB[0].length !== colsA) {
        return res.status(400).json({ detail: 'Matrix B must match dimensions of Matrix A' });
      }
      const result = matrixA.map((row: number[], r: number) =>
        row.map((val: number, c: number) => (op === 'add' ? val + matrixB[r][c] : val - matrixB[r][c]))
      );
      return res.json({ result, operation: op, rows: rowsA, cols: colsA, status: 'success' });
    }

    if (op === 'multiply') {
      if (!matrixB || !Array.isArray(matrixB)) {
        return res.status(400).json({ detail: 'Matrix B is required for multiplication' });
      }
      const rowsB = matrixB.length;
      const colsB = matrixB[0].length;
      if (colsA !== rowsB) {
        return res.status(400).json({ detail: `Cannot multiply ${rowsA}x${colsA} matrix by ${rowsB}x${colsB}` });
      }
      const result = math.multiply(matrixA, matrixB);
      return res.json({ result, operation: 'multiply', rows: rowsA, cols: colsB, status: 'success' });
    }

    return res.status(400).json({ detail: `Unsupported matrix operation: ${op}` });
  } catch (err: any) {
    return res.status(400).json({ detail: err.message || 'Matrix calculation failed' });
  }
});

// Loan / Mortgage Amortization
app.post('/api/finance/loan', (req: Request, res: Response) => {
  const { principal, annual_rate_percent, tenure_years, extra_monthly_payment = 0 } = req.body;
  const P = parseFloat(principal);
  const rate = parseFloat(annual_rate_percent);
  const years = parseFloat(tenure_years);
  const extra = parseFloat(extra_monthly_payment) || 0;

  if (isNaN(P) || P <= 0 || isNaN(rate) || rate < 0 || isNaN(years) || years <= 0) {
    return res.status(400).json({ detail: 'Valid positive loan parameters required' });
  }

  const r = rate / 100 / 12;
  const n = Math.round(years * 12);
  let emi = 0;

  if (r === 0) {
    emi = P / n;
  } else {
    emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  let balance = P;
  let totalInterest = 0;
  const scheduleSummary: Array<{ year: number; remaining_balance: number; cumulative_interest: number; principal_paid: number }> = [];

  let month = 0;
  let cumulativePrincipal = 0;

  while (balance > 0.01 && month < n + 120) {
    month++;
    const interestPart = balance * r;
    const principalPart = Math.min(balance, emi + extra - interestPart);
    if (principalPart <= 0) break;

    balance -= principalPart;
    totalInterest += interestPart;
    cumulativePrincipal += principalPart;

    if (month % 12 === 0 || balance <= 0.01) {
      scheduleSummary.push({
        year: Math.ceil(month / 12),
        remaining_balance: Math.round(Math.max(0, balance) * 100) / 100,
        cumulative_interest: Math.round(totalInterest * 100) / 100,
        principal_paid: Math.round(cumulativePrincipal * 100) / 100
      });
    }
  }

  return res.json({
    monthly_emi: Math.round(emi * 100) / 100,
    total_interest: Math.round(totalInterest * 100) / 100,
    total_payment: Math.round((P + totalInterest) * 100) / 100,
    tenure_months: month,
    schedule_summary: scheduleSummary
  });
});

// Compound Interest
app.post('/api/finance/compound', (req: Request, res: Response) => {
  const { principal, monthly_contribution = 0, annual_rate_percent, years, compound_frequency = 12 } = req.body;
  const P = parseFloat(principal) || 0;
  const PMT = parseFloat(monthly_contribution) || 0;
  const r = (parseFloat(annual_rate_percent) || 0) / 100;
  const t = parseInt(years, 10) || 1;
  const m = parseInt(compound_frequency, 10) || 12;

  let balance = P;
  let totalDeposited = P;
  const breakdown: Array<{ year: number; total_balance: number; total_contributions: number; total_interest: number }> = [];

  for (let y = 1; y <= t; y++) {
    for (let month = 0; month < 12; month++) {
      balance += PMT;
      totalDeposited += PMT;
      // Monthly compound portion
      balance *= 1 + r / 12;
    }
    breakdown.push({
      year: y,
      total_balance: Math.round(balance * 100) / 100,
      total_contributions: Math.round(totalDeposited * 100) / 100,
      total_interest: Math.round((balance - totalDeposited) * 100) / 100
    });
  }

  res.json({
    final_balance: Math.round(balance * 100) / 100,
    total_deposits: Math.round(totalDeposited * 100) / 100,
    total_interest: Math.round((balance - totalDeposited) * 100) / 100,
    breakdown
  });
});

// Programmer Bitwise
app.post('/api/programmer/bitwise', (req: Request, res: Response) => {
  const { value = 0, bit_width = 32 } = req.body;
  const val = BigInt(value);
  const w = BigInt(bit_width);
  const mask = (1n << w) - 1n;
  const maskedVal = val & mask;

  let binStr = maskedVal.toString(2).padStart(Number(w), '0');
  let hexStr = '0x' + maskedVal.toString(16).toUpperCase().padStart(Number(w) / 4, '0');
  let octStr = '0o' + maskedVal.toString(8);

  const popcount = (binStr.match(/1/g) || []).length;

  res.json({
    original: Number(val),
    bit_width: Number(w),
    hex: hexStr,
    dec: maskedVal.toString(10),
    oct: octStr,
    bin: binStr,
    popcount,
    not_val: Number((~maskedVal) & mask)
  });
});

// Unit Conversion
app.post('/api/convert/unit', (req: Request, res: Response) => {
  const { category, from_unit, to_unit, value } = req.body;
  const val = parseFloat(value);
  if (isNaN(val)) return res.status(400).json({ detail: 'Invalid numeric value' });

  // Conversion table (base units: meter, kg, celsius, m/s, liter, sq_meter, byte)
  const rates: Record<string, Record<string, number | ((v: number) => number)>> = {
    length: {
      meter: 1,
      kilometer: 1000,
      centimeter: 0.01,
      millimeter: 0.001,
      mile: 1609.344,
      yard: 0.9144,
      foot: 0.3048,
      inch: 0.0254,
      nautical_mile: 1852
    },
    mass: {
      kilogram: 1,
      gram: 0.001,
      milligram: 0.000001,
      pound: 0.45359237,
      ounce: 0.0283495,
      metric_ton: 1000
    },
    data: {
      byte: 1,
      kilobyte: 1024,
      megabyte: 1024 ** 2,
      gigabyte: 1024 ** 3,
      terabyte: 1024 ** 4,
      bit: 0.125
    },
    speed: {
      'm/s': 1,
      'km/h': 0.277778,
      mph: 0.44704,
      knot: 0.514444
    },
    area: {
      sq_meter: 1,
      sq_kilometer: 1000000,
      sq_foot: 0.092903,
      sq_mile: 2589988.11,
      acre: 4046.856,
      hectare: 10000
    },
    volume: {
      liter: 1,
      milliliter: 0.001,
      cubic_meter: 1000,
      us_gallon: 3.78541,
      us_quart: 0.946353,
      us_cup: 0.236588
    }
  };

  // Special handle temperature
  if (category === 'temperature') {
    let celsius = val;
    if (from_unit === 'fahrenheit') celsius = (val - 32) * (5 / 9);
    else if (from_unit === 'kelvin') celsius = val - 273.15;

    let target = celsius;
    if (to_unit === 'fahrenheit') target = celsius * (9 / 5) + 32;
    else if (to_unit === 'kelvin') target = celsius + 273.15;

    return res.json({
      value: val,
      from_unit,
      to_unit,
      result: Math.round(target * 1e6) / 1e6
    });
  }

  const catMap = rates[category];
  if (!catMap || !catMap[from_unit] || !catMap[to_unit]) {
    return res.status(400).json({ detail: 'Unsupported unit category or pair' });
  }

  const baseVal = val * (catMap[from_unit] as number);
  const targetVal = baseVal / (catMap[to_unit] as number);

  res.json({
    value: val,
    from_unit,
    to_unit,
    result: Math.round(targetVal * 1e8) / 1e8
  });
});

// Calculation History API
app.get('/api/history', (req: Request, res: Response) => {
  res.json(calculationHistory);
});

app.delete('/api/history', (req: Request, res: Response) => {
  calculationHistory.length = 0;
  res.json({ status: 'cleared' });
});

// FastAPI / OpenAPI JSON Spec for in-app Swagger Inspector
app.get('/api/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'One Calculator FastAPI Backend',
      description: 'Unified high-performance math, matrix, finance, and programmer API matching FastAPI specifications.',
      version: '1.0.0'
    },
    paths: {
      '/api/evaluate': {
        post: {
          summary: 'Evaluate mathematical expression',
          parameters: [],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    expression: { type: 'string', example: 'sin(45) * sqrt(144) + 2^4' },
                    angle_mode: { type: 'string', enum: ['deg', 'rad'], default: 'deg' },
                    precision: { type: 'integer', default: 10 }
                  },
                  required: ['expression']
                }
              }
            }
          }
        }
      },
      '/api/python/eval': {
        post: {
          summary: 'Execute live Python math AST snippet',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: '[math.comb(10, k) for k in range(11)]' }
                  },
                  required: ['code']
                }
              }
            }
          }
        }
      },
      '/api/matrix/operations': {
        post: {
          summary: 'Perform matrix arithmetic, determinant, inverse, or transpose'
        }
      },
      '/api/finance/loan': {
        post: {
          summary: 'Compute loan amortization schedule, monthly payment, and interest breakdown'
        }
      },
      '/api/finance/compound': {
        post: {
          summary: 'Compound interest with periodic contributions and annual forecast'
        }
      },
      '/api/programmer/bitwise': {
        post: {
          summary: 'Bitwise calculations, masks, and representations (HEX/DEC/OCT/BIN)'
        }
      },
      '/api/convert/unit': {
        post: {
          summary: 'Convert values across length, weight, temperature, data, and volume'
        }
      }
    }
  });
});

// Setup Vite middleware or Static files
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[One Calculator Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

"""
One Calculator - Python FastAPI Backend Service
Provides high-performance mathematical evaluation, matrix algebra,
financial modeling, unit conversion, and programmer bitwise operations.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
import math
import cmath
import time
import ast

app = FastAPI(
    title="One Calculator API",
    description="Full-featured mathematical and scientific computation backend built with FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= Models =================
class EvalRequest(BaseModel):
    expression: str = Field(..., example="sin(pi / 4) * sqrt(16) + 2^3")
    angle_mode: Optional[str] = Field("deg", description="'deg' or 'rad'")
    precision: Optional[int] = Field(10, ge=1, le=20)

class EvalResponse(BaseModel):
    result: Union[float, int, str]
    formatted: str
    expression: str
    engine: str = "FastAPI Python Math"
    execution_time_ms: float
    status: str = "success"

class PythonExecRequest(BaseModel):
    code: str = Field(..., example="[x**2 for x in range(1, 11) if x % 2 == 0]")

class PythonExecResponse(BaseModel):
    result: Any
    repr_str: str
    output_type: str
    execution_time_ms: float
    status: str

class MatrixOpRequest(BaseModel):
    operation: str = Field(..., example="multiply", description="add, subtract, multiply, det, inverse, transpose, trace")
    matrixA: List[List[float]]
    matrixB: Optional[List[List[float]]] = None

class MatrixOpResponse(BaseModel):
    result: Optional[Union[List[List[float]], float]]
    operation: str
    rows: Optional[int] = None
    cols: Optional[int] = None
    status: str = "success"
    message: Optional[str] = None

class LoanRequest(BaseModel):
    principal: float = Field(..., gt=0, example=250000)
    annual_rate_percent: float = Field(..., ge=0, example=6.5)
    tenure_years: float = Field(..., gt=0, example=30)
    extra_monthly_payment: Optional[float] = Field(0.0, ge=0)

class LoanResponse(BaseModel):
    monthly_emi: float
    total_interest: float
    total_payment: float
    schedule_summary: List[Dict[str, Any]]

class CompoundInterestRequest(BaseModel):
    principal: float = Field(..., ge=0, example=10000)
    monthly_contribution: float = Field(0.0, ge=0, example=500)
    annual_rate_percent: float = Field(..., ge=0, example=8.0)
    years: int = Field(..., gt=0, le=100, example=15)
    compound_frequency: Optional[int] = Field(12, description="Compounds per year (12=monthly, 1=yearly)")

class UnitConvertRequest(BaseModel):
    category: str = Field(..., example="length")
    from_unit: str = Field(..., example="meter")
    to_unit: str = Field(..., example="feet")
    value: float = Field(..., example=10)

class ProgrammerBitwiseRequest(BaseModel):
    value: int = Field(..., example=42)
    bit_width: Optional[int] = Field(32, description="8, 16, 32, or 64")


# ================= Endpoints =================

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "One Calculator FastAPI Backend", "timestamp": time.time()}

@app.post("/api/evaluate", response_model=EvalResponse)
def evaluate_math(req: EvalRequest):
    t0 = time.perf_counter()
    expr = req.expression.strip()
    if not expr:
        raise HTTPException(status_code=400, detail="Empty expression")

    # Safe math environment
    math_env = {
        "sin": math.sin if req.angle_mode == "rad" else lambda x: math.sin(math.radians(x)),
        "cos": math.cos if req.angle_mode == "rad" else lambda x: math.cos(math.radians(x)),
        "tan": math.tan if req.angle_mode == "rad" else lambda x: math.tan(math.radians(x)),
        "asin": math.asin if req.angle_mode == "rad" else lambda x: math.degrees(math.asin(x)),
        "acos": math.acos if req.angle_mode == "rad" else lambda x: math.degrees(math.acos(x)),
        "atan": math.atan if req.angle_mode == "rad" else lambda x: math.degrees(math.atan(x)),
        "sinh": math.sinh, "cosh": math.cosh, "tanh": math.tanh,
        "sqrt": math.sqrt, "cbrt": math.cbrt if hasattr(math, 'cbrt') else lambda x: x ** (1/3),
        "log": math.log10, "ln": math.log, "log2": math.log2,
        "exp": math.exp, "abs": abs, "factorial": math.factorial,
        "pi": math.pi, "e": math.e, "tau": math.tau, "phi": (1 + math.sqrt(5)) / 2,
    }

    # Normalize expression (replace ^ with **)
    safe_expr = expr.replace("^", "**").replace("×", "*").replace("÷", "/")

    try:
        # Validate AST to avoid unsafe calls
        parsed = ast.parse(safe_expr, mode='eval')
        for node in ast.walk(parsed):
            if isinstance(node, (ast.Import, ast.ImportFrom, ast.Exec, ast.Global)):
                raise ValueError("Disallowed AST node")
            if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
                raise ValueError("Disallowed private attribute access")

        result = eval(compile(parsed, "<calc>", "eval"), {"__builtins__": {}}, math_env)
        if isinstance(result, float) and (math.isinf(result) or math.isnan(result)):
            formatted = str(result)
        elif isinstance(result, (int, float)):
            formatted = f"{result:.{req.precision}g}"
        else:
            formatted = str(result)

        t1 = time.perf_counter()
        return EvalResponse(
            result=result if isinstance(result, (int, float)) else formatted,
            formatted=formatted,
            expression=req.expression,
            engine="FastAPI (Python Math AST)",
            execution_time_ms=round((t1 - t0) * 1000, 3)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

@app.post("/api/python/eval", response_model=PythonExecResponse)
def python_exec(req: PythonExecRequest):
    t0 = time.perf_counter()
    code = req.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Empty Python snippet")

    safe_scope = {
        "math": math,
        "cmath": cmath,
        "pi": math.pi,
        "e": math.e,
        "abs": abs,
        "sum": sum,
        "min": min,
        "max": max,
        "round": round,
        "len": len,
        "range": range,
        "list": list,
        "dict": dict,
        "set": set,
        "sorted": sorted,
        "zip": zip,
        "enumerate": enumerate,
    }

    try:
        # Try evaluating as single expression first
        try:
            expr_ast = ast.parse(code, mode='eval')
            val = eval(compile(expr_ast, "<python_runner>", "eval"), {"__builtins__": {}}, safe_scope)
        except SyntaxError:
            # Multi-line statement execution
            mod_ast = ast.parse(code, mode='exec')
            local_vars = {}
            exec(compile(mod_ast, "<python_runner>", "exec"), {"__builtins__": {}}, safe_scope)
            val = safe_scope.get("result", list(safe_scope.keys())[-1] if safe_scope else "Executed successfully")

        t1 = time.perf_counter()
        return PythonExecResponse(
            result=val if isinstance(val, (int, float, str, bool, list, dict)) else str(val),
            repr_str=repr(val),
            output_type=type(val).__name__,
            execution_time_ms=round((t1 - t0) * 1000, 3),
            status="success"
        )
    except Exception as e:
        return PythonExecResponse(
            result=None,
            repr_str=f"Error: {str(e)}",
            output_type="error",
            execution_time_ms=round((time.perf_counter() - t0) * 1000, 3),
            status="error"
        )

@app.post("/api/matrix/operations", response_model=MatrixOpResponse)
def matrix_operation(req: MatrixOpRequest):
    op = req.operation.lower()
    A = req.matrixA
    B = req.matrixB

    if not A or not isinstance(A, list) or not A[0]:
        raise HTTPException(status_code=400, detail="Matrix A cannot be empty")

    rows_a, cols_a = len(A), len(A[0])

    if op == "transpose":
        res = [[A[r][c] for r in range(rows_a)] for c in range(cols_a)]
        return MatrixOpResponse(result=res, operation="transpose", rows=cols_a, cols=rows_a)

    elif op == "trace":
        if rows_a != cols_a:
            raise HTTPException(status_code=400, detail="Matrix must be square for trace")
        tr = sum(A[i][i] for i in range(rows_a))
        return MatrixOpResponse(result=tr, operation="trace", rows=1, cols=1)

    elif op == "det":
        if rows_a != cols_a:
            raise HTTPException(status_code=400, detail="Matrix must be square for determinant")
        def calc_det(m):
            n = len(m)
            if n == 1: return m[0][0]
            if n == 2: return m[0][0]*m[1][1] - m[0][1]*m[1][0]
            d = 0.0
            for col in range(n):
                sub = [row[:col] + row[col+1:] for row in m[1:]]
                d += ((-1)**col) * m[0][col] * calc_det(sub)
            return d
        det_val = round(calc_det(A), 8)
        return MatrixOpResponse(result=det_val, operation="determinant", rows=1, cols=1)

    elif op == "add":
        if not B or len(B) != rows_a or len(B[0]) != cols_a:
            raise HTTPException(status_code=400, detail="Matrices must have matching dimensions for addition")
        res = [[A[r][c] + B[r][c] for c in range(cols_a)] for r in range(rows_a)]
        return MatrixOpResponse(result=res, operation="add", rows=rows_a, cols=cols_a)

    elif op == "subtract":
        if not B or len(B) != rows_a or len(B[0]) != cols_a:
            raise HTTPException(status_code=400, detail="Matrices must have matching dimensions for subtraction")
        res = [[A[r][c] - B[r][c] for c in range(cols_a)] for r in range(rows_a)]
        return MatrixOpResponse(result=res, operation="subtract", rows=rows_a, cols=cols_a)

    elif op == "multiply":
        if not B:
            raise HTTPException(status_code=400, detail="Matrix B required for multiplication")
        rows_b, cols_b = len(B), len(B[0])
        if cols_a != rows_b:
            raise HTTPException(status_code=400, detail=f"Cannot multiply ({rows_a}x{cols_a}) by ({rows_b}x{cols_b})")
        res = [[sum(A[r][k] * B[k][c] for k in range(cols_a)) for c in range(cols_b)] for r in range(rows_a)]
        return MatrixOpResponse(result=res, operation="multiply", rows=rows_a, cols=cols_b)

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported matrix operation: {op}")

@app.post("/api/finance/loan", response_model=LoanResponse)
def calculate_loan(req: LoanRequest):
    P = req.principal
    r = (req.annual_rate_percent / 100.0) / 12.0
    n = int(req.tenure_years * 12)
    extra = req.extra_monthly_payment or 0.0

    if r == 0:
        base_emi = P / n
    else:
        base_emi = (P * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)

    total_monthly = base_emi + extra
    balance = P
    total_interest = 0.0
    schedule_summary = []
    month = 0

    while balance > 0.001 and month < n + 120:
        month += 1
        interest_charge = balance * r if r > 0 else 0
        principal_part = min(balance, total_monthly - interest_charge)
        if principal_part <= 0:
            break
        balance -= principal_part
        total_interest += interest_charge

        if month % 12 == 0 or balance <= 0.001:
            schedule_summary.append({
                "year": math.ceil(month / 12),
                "remaining_balance": round(max(0.0, balance), 2),
                "cumulative_interest": round(total_interest, 2)
            })

    return LoanResponse(
        monthly_emi=round(base_emi, 2),
        total_interest=round(total_interest, 2),
        total_payment=round(P + total_interest, 2),
        schedule_summary=schedule_summary
    )

@app.post("/api/programmer/bitwise")
def calculate_bitwise(req: ProgrammerBitwiseRequest):
    val = req.value
    w = req.bit_width or 32
    mask = (1 << w) - 1
    masked_val = val & mask
    bin_str = bin(masked_val)[2:].zfill(w)
    hex_str = hex(masked_val)[2:].upper().zfill(w // 4)
    oct_str = oct(masked_val)[2:]

    return {
        "original": val,
        "bit_width": w,
        "masked_int": masked_val,
        "hex": "0x" + hex_str,
        "dec": str(masked_val),
        "oct": "0o" + oct_str,
        "bin": bin_str,
        "not_val": (~val) & mask,
        "popcount": bin_str.count('1'),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

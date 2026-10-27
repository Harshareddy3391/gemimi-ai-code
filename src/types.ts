export type CalculatorMode =
  | 'scientific'
  | 'programmer'
  | 'financial'
  | 'converter'
  | 'matrix'
  | 'graphing'
  | 'python';

export type AngleMode = 'deg' | 'rad';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  category: string;
  timestamp: number;
}

export interface EvalResponse {
  result: any;
  formatted: string;
  expression: string;
  engine: string;
  execution_time_ms: number;
  status: 'success' | 'error';
  detail?: string;
}

export interface PythonExecResponse {
  result: any;
  repr_str: string;
  output_type: string;
  execution_time_ms: number;
  status: 'success' | 'error';
}

export interface LoanResult {
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
  tenure_months: number;
  schedule_summary: Array<{
    year: number;
    remaining_balance: number;
    cumulative_interest: number;
    principal_paid: number;
  }>;
}

export interface CompoundResult {
  final_balance: number;
  total_deposits: number;
  total_interest: number;
  breakdown: Array<{
    year: number;
    total_balance: number;
    total_contributions: number;
    total_interest: number;
  }>;
}

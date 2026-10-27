import React, { useState, useEffect } from 'react';
import { Landmark, PiggyBank, DollarSign, Calendar, Percent, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { CalculatorApiService } from '../services/api';
import { CompoundResult, LoanResult } from '../types';

export const FinancialCalculator: React.FC = () => {
  const [tab, setTab] = useState<'loan' | 'compound'>('loan');

  // Loan state
  const [loanPrincipal, setLoanPrincipal] = useState<number>(300000);
  const [loanRate, setLoanRate] = useState<number>(6.5);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [loanExtra, setLoanExtra] = useState<number>(0);
  const [loanResult, setLoanResult] = useState<LoanResult | null>(null);
  const [loanLoading, setLoanLoading] = useState<boolean>(false);

  // Compound interest state
  const [compPrincipal, setCompPrincipal] = useState<number>(10000);
  const [compMonthly, setCompMonthly] = useState<number>(500);
  const [compRate, setCompRate] = useState<number>(8.0);
  const [compYears, setCompYears] = useState<number>(15);
  const [compResult, setCompResult] = useState<CompoundResult | null>(null);
  const [compLoading, setCompLoading] = useState<boolean>(false);

  // Fetch loan
  const computeLoan = async () => {
    setLoanLoading(true);
    try {
      const res = await CalculatorApiService.calculateLoan(loanPrincipal, loanRate, loanYears, loanExtra);
      setLoanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoanLoading(false);
    }
  };

  // Fetch compound
  const computeCompound = async () => {
    setCompLoading(true);
    try {
      const res = await CalculatorApiService.calculateCompound(compPrincipal, compMonthly, compRate, compYears);
      setCompResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'loan') {
      computeLoan();
    } else {
      computeCompound();
    }
  }, [tab, loanPrincipal, loanRate, loanYears, loanExtra, compPrincipal, compMonthly, compRate, compYears]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Tab Switcher */}
      <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 max-w-md mx-auto w-full">
        <button
          onClick={() => setTab('loan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'loan'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Mortgage & Loan EMI</span>
        </button>
        <button
          onClick={() => setTab('compound')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'compound'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Compound Growth</span>
        </button>
      </div>

      {tab === 'loan' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Inputs Column */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-cyan-400" />
              <span>Loan Parameters</span>
            </h3>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Loan Amount (Principal)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Annual Interest Rate</span>
                <span className="text-cyan-400 font-mono font-semibold">{loanRate}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.1%</span>
                <span>10%</span>
                <span>20%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Loan Term</span>
                <span className="text-cyan-400 font-mono font-semibold">{loanYears} Years ({loanYears * 12} mo)</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[10, 15, 20, 30].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setLoanYears(yr)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                      loanYears === yr
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {yr}y
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Extra Monthly Payment (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={loanExtra}
                  onChange={(e) => setLoanExtra(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {loanResult && (
              <>
                {/* Big Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Monthly EMI</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                      {formatCurrency(loanResult.monthly_emi + loanExtra)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">per month</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Total Interest</span>
                    <span className="text-2xl font-bold font-mono text-rose-400 mt-1">
                      {formatCurrency(loanResult.total_interest)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">cost of borrowing</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Total Payment</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1">
                      {formatCurrency(loanResult.total_payment)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">principal + interest</span>
                  </div>
                </div>

                {/* Ratio Bar */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      Principal: {formatCurrency(loanPrincipal)} (
                      {Math.round((loanPrincipal / loanResult.total_payment) * 100)}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Interest: {formatCurrency(loanResult.total_interest)} (
                      {Math.round((loanResult.total_interest / loanResult.total_payment) * 100)}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${(loanPrincipal / loanResult.total_payment) * 100}%` }}
                      className="bg-cyan-500 h-full"
                    />
                    <div
                      style={{ width: `${(loanResult.total_interest / loanResult.total_payment) * 100}%` }}
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </div>

                {/* Amortization Schedule Table */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs font-semibold text-slate-300 mb-2">
                    Amortization Forecast (Milestones)
                  </span>
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-800">
                    <table className="w-full text-xs font-mono text-left">
                      <thead className="bg-slate-800/80 text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Year</th>
                          <th className="py-2 px-3">Principal Paid</th>
                          <th className="py-2 px-3">Total Interest</th>
                          <th className="py-2 px-3">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {loanResult.schedule_summary.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-cyan-400 font-semibold">Yr {row.year}</td>
                            <td className="py-2 px-3 text-slate-300">{formatCurrency(row.principal_paid)}</td>
                            <td className="py-2 px-3 text-rose-300">{formatCurrency(row.cumulative_interest)}</td>
                            <td className="py-2 px-3 text-slate-200">{formatCurrency(row.remaining_balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Compound Interest Tab */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Compound Inputs */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <span>Investment Parameters</span>
            </h3>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Initial Deposit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={compPrincipal}
                  onChange={(e) => setCompPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Monthly Contribution
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={compMonthly}
                  onChange={(e) => setCompMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Estimated Annual Return</span>
                <span className="text-emerald-400 font-mono font-semibold">{compRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={compRate}
                onChange={(e) => setCompRate(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Time Horizon</span>
                <span className="text-emerald-400 font-mono font-semibold">{compYears} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={compYears}
                onChange={(e) => setCompYears(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Compound Results */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {compResult && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Future Value</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                      {formatCurrency(compResult.final_balance)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">at {compYears} years</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Total Deposited</span>
                    <span className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                      {formatCurrency(compResult.total_deposits)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">principal + savings</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Compound Interest</span>
                    <span className="text-2xl font-bold font-mono text-amber-300 mt-1">
                      {formatCurrency(compResult.total_interest)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">wealth generated</span>
                  </div>
                </div>

                {/* Visual Trajectory */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs font-semibold text-slate-300 mb-2">
                    Annual Growth Progression
                  </span>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-800">
                    <table className="w-full text-xs font-mono text-left">
                      <thead className="bg-slate-800/80 text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Year</th>
                          <th className="py-2 px-3">Total Invested</th>
                          <th className="py-2 px-3">Interest Gained</th>
                          <th className="py-2 px-3">Portfolio Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {compResult.breakdown.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-emerald-400 font-semibold">Yr {row.year}</td>
                            <td className="py-2 px-3 text-cyan-300">{formatCurrency(row.total_contributions)}</td>
                            <td className="py-2 px-3 text-amber-300">{formatCurrency(row.total_interest)}</td>
                            <td className="py-2 px-3 text-white font-medium">{formatCurrency(row.total_balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

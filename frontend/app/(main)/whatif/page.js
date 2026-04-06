"use client";

import { useState, useEffect } from "react";

const API = "http://localhost:8000";

function formatType(type) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function money(v) {
  return `£${parseFloat(v).toFixed(2)}`;
}

export default function WhatIf() {
  const [shiftTypes, setShiftTypes] = useState([]);
  const [sufficiency, setSufficiency] = useState(null);
  const [historyMonths, setHistoryMonths] = useState([]);

  // Hindsight
  const [hindsightForm, setHindsightForm] = useState({ month: "", year: "" });
  const [cfHours, setCfHours] = useState({});
  const [monthSummary, setMonthSummary] = useState(null);
  const [hindsightResult, setHindsightResult] = useState(null);
  const [hindsightError, setHindsightError] = useState(null);
  const [hindsightLoading, setHindsightLoading] = useState(false);

  // Forecasting
  const [forecastHours, setForecastHours] = useState({});
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastError, setForecastError] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/counterfactual/shift-types`)
      .then((r) => r.json())
      .then((types) => {
        setShiftTypes(types);
        const initial = {};
        types.forEach((t) => (initial[t] = ""));
        setCfHours(initial);
        setForecastHours({ ...initial });
      })
      .catch(() => {});

    fetch(`${API}/counterfactual/sufficiency`)
      .then((r) => r.json())
      .then((data) => setSufficiency(data))
      .catch(() => setSufficiency({ sufficient: false, error: "Failed to reach the backend." }));

    fetch(`${API}/history/months`)
      .then((r) => r.json())
      .then((data) => setHistoryMonths(data))
      .catch(() => {});
  }, []);

  function selectHistoryMonth(val) {
    if (!val) {
      setHindsightForm({ month: "", year: "" });
      setMonthSummary(null);
      return;
    }
    const [year, month] = val.split("-").map(Number);
    setHindsightForm({ month, year });
    fetch(`${API}/counterfactual/month-summary/${year}/${month}`)
      .then((r) => r.json())
      .then((data) => setMonthSummary(Object.keys(data).length ? data : null))
      .catch(() => setMonthSummary(null));
  }

  async function handleHindsightSubmit(e) {
    e.preventDefault();
    setHindsightLoading(true);
    setHindsightResult(null);
    setHindsightError(null);

    const parsedHours = {};
    shiftTypes.forEach((t) => { parsedHours[t] = parseFloat(cfHours[t]) || 0; });

    try {
      const res = await fetch(`${API}/counterfactual/hindsight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: parseInt(hindsightForm.month),
          year: parseInt(hindsightForm.year),
          cf_hours: parsedHours,
        }),
      });
      const data = await res.json();
      if (data.error) setHindsightError(data.error);
      else setHindsightResult(data);
    } catch {
      setHindsightError("Failed to reach the backend.");
    } finally {
      setHindsightLoading(false);
    }
  }

  async function handleForecastSubmit(e) {
    e.preventDefault();
    setForecastLoading(true);
    setForecastResult(null);
    setForecastError(null);

    const parsedHours = {};
    shiftTypes.forEach((t) => { parsedHours[t] = parseFloat(forecastHours[t]) || 0; });

    try {
      const res = await fetch(`${API}/counterfactual/shift-planning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planned_hours: parsedHours }),
      });
      const data = await res.json();
      if (data.error) setForecastError(data.error);
      else setForecastResult(data);
    } catch {
      setForecastError("Failed to reach the backend.");
    } finally {
      setForecastLoading(false);
    }
  }

  // Locked screen
  if (sufficiency && !sufficiency.sufficient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-text mb-4">Locked</h2>
          {sufficiency.error ? (
            <p className="text-muted text-sm">{sufficiency.error}</p>
          ) : (
            <p className="text-muted text-sm">
              The What If models need at least{" "}
              <span className="text-text font-semibold">6 months</span> of closed history to run.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[40px] font-bold text-text mb-1 inline-block border-b-4 border-accent pb-1">What If?</h1>
      </div>

      {/* ── Hindsight ── */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-xl font-bold text-text mb-4">Hindsight</h2>

        <form onSubmit={handleHindsightSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Select Month
            <select required
              value={hindsightForm.month && hindsightForm.year ? `${hindsightForm.year}-${hindsightForm.month}` : ""}
              onChange={(e) => selectHistoryMonth(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">Choose a month</option>
              {historyMonths.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {MONTH_NAMES[m.month - 1]} {m.year}
                </option>
              ))}
            </select>
          </label>

          {/* Actual month summary */}
          {monthSummary && monthSummary.hours && (
            <div className="bg-[#262626] rounded-lg p-3 text-sm">
              <p className="text-xs text-muted font-medium mb-2">Actual Summary</p>
              <div className="flex flex-col gap-1">
                {Object.entries(monthSummary.hours).map(([type, hrs]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-muted">{formatType(type)} Hours</span>
                    <span className="text-text">{hrs}h</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                  <span className="text-muted">Income</span>
                  <span className="text-text">{money(monthSummary.income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Spent</span>
                  <span className="text-text">{money(monthSummary.total_spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Left Over</span>
                  <span className="text-text">{money(monthSummary.left_over)}</span>
                </div>
              </div>
            </div>
          )}

          {!monthSummary && hindsightForm.month && hindsightForm.year && (
            <p className="text-sm text-muted">No data found for this month.</p>
          )}

          {/* Counterfactual hour inputs */}
          <div className="flex flex-col gap-2">
            {shiftTypes.map((type) => (
              <label key={type} className="flex flex-col gap-1 text-sm text-muted">
                Counterfactual {formatType(type)} Hours
                <input type="number" required min="0" step="0.5" value={cfHours[type] || ""}
                  onChange={(e) => setCfHours({ ...cfHours, [type]: e.target.value })}
                  className="px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </label>
            ))}
          </div>

          <button type="submit" disabled={hindsightLoading}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {hindsightLoading ? "Calculating..." : "Run Hindsight"}
          </button>
        </form>

        {hindsightError && <p className="text-sm text-negative mt-3">{hindsightError}</p>}

        {hindsightResult && (
          <div className="mt-5 border-t border-gray-700 pt-4 flex flex-col gap-4">

            {/* Counterfactual */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Counterfactual</h3>
              <div className="bg-[#262626] rounded-lg p-3 text-sm">
                <div className="flex text-xs text-muted font-medium mb-2 border-b border-gray-700 pb-1">
                  <span className="flex-1"></span>
                  <span className="w-28 text-center">Estimate</span>
                  <span className="w-36 text-center">Range (95% confidence)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <span className="flex-1 text-muted">Income</span>
                    <span className="w-28 text-center text-text">{money(hindsightResult.counterfactual.cf_income)}</span>
                    <span className="w-36 text-center text-muted text-xs">{money(hindsightResult.distribution.income.p2_5)} – {money(hindsightResult.distribution.income.p97_5)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex-1 text-muted">Total Spent</span>
                    <span className="w-28 text-center text-text">{money(hindsightResult.counterfactual.cf_spent)}</span>
                    <span className="w-36 text-center text-muted text-xs">{money(hindsightResult.distribution.spending.p2_5)} – {money(hindsightResult.distribution.spending.p97_5)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex-1 text-muted">Left Over</span>
                    <span className="w-28 text-center text-text">{money(hindsightResult.counterfactual.cf_left_over)}</span>
                    <span className="w-36 text-center text-muted text-xs">{money(hindsightResult.distribution.left_over.p2_5)} – {money(hindsightResult.distribution.left_over.p97_5)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Fit */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Model Fit</h3>
              <div className="bg-[#262626] rounded-lg p-3 text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-muted">Income R²</span>
                  <span className="text-text">{hindsightResult.model_fit.income_r2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Spending R²</span>
                  <span className="text-text">{hindsightResult.model_fit.spending_r2}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Forecasting ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-xl font-bold text-text mb-4">Forecasting</h2>

        <form onSubmit={handleForecastSubmit} className="flex flex-col gap-3">
          {shiftTypes.map((type) => (
            <label key={type} className="flex flex-col gap-1 text-sm text-muted">
              Planned {formatType(type)} Hours
              <input type="number" required min="0" step="0.5" value={forecastHours[type] || ""}
                onChange={(e) => setForecastHours({ ...forecastHours, [type]: e.target.value })}
                className="px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>
          ))}

          <button type="submit" disabled={forecastLoading}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {forecastLoading ? "Calculating..." : "Run Forecast"}
          </button>
        </form>

        {forecastError && <p className="text-sm text-negative mt-3">{forecastError}</p>}

        {forecastResult && (
          <div className="mt-5 border-t border-gray-700 pt-4 flex flex-col gap-4">

            {/* Baseline vs Planned */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Baseline vs Planned</h3>
              <div className="bg-[#262626] rounded-lg p-3 text-sm">
                <div className="flex text-xs text-muted font-medium mb-2 border-b border-gray-700 pb-1">
                  <span className="flex-1"></span>
                  <span className="w-32 text-center">Baseline (avg)</span>
                  <span className="w-32 text-center">Planned</span>
                </div>
                <div className="flex flex-col gap-1">
                  {shiftTypes.map((t) => (
                    <div key={t} className="flex items-center">
                      <span className="flex-1 text-muted">{formatType(t)} Hours</span>
                      <span className="w-32 text-center text-text">{forecastResult.baseline.hours[t] ?? 0}h</span>
                      <span className="w-32 text-center text-text">{forecastResult.planned.hours[t] ?? 0}h</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700 pt-1 mt-1 flex flex-col gap-1">
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Income</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.baseline.income)}</span>
                      <span className="w-32 text-center text-accent font-medium">{money(forecastResult.planned.income)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Fixed Costs</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.baseline.fixed_costs)}</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.planned.fixed_costs)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Envelope Spending</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.baseline.envelope_spending)}</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.planned.envelope_spending)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Available to Save</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.baseline.available_to_save)}</span>
                      <span className="w-32 text-center text-accent font-medium">{money(forecastResult.planned.available_to_save)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Goal Contribution</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.baseline.goal_contribution)}</span>
                      <span className="w-32 text-center text-text">{money(forecastResult.planned.goal_contribution)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 95% Confidence Interval */}
            {forecastResult.distribution && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Planned — 95% Confidence Interval</h3>
                <div className="bg-[#262626] rounded-lg p-3 text-sm">
                  <div className="flex text-xs text-muted font-medium mb-2 border-b border-gray-700 pb-1">
                    <span className="flex-1"></span>
                    <span className="w-24 text-center">Lower</span>
                    <span className="w-24 text-center">Median</span>
                    <span className="w-24 text-center">Upper</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Income</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.income.p2_5)}</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.income.p50)}</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.income.p97_5)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Envelope Spending</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.spending.p2_5)}</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.spending.p50)}</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.spending.p97_5)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1 text-muted">Left Over</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.left_over.p2_5)}</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.left_over.p50)}</span>
                      <span className="w-24 text-center text-text">{money(forecastResult.distribution.left_over.p97_5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Projections */}
            {forecastResult.goals.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Goal Projections</h3>
                <div className="bg-[#262626] rounded-lg p-3 text-sm">
                  <div className="flex text-xs text-muted font-medium mb-2 border-b border-gray-700 pb-1">
                    <span className="flex-1">Goal</span>
                    <span className="w-20 text-center">Current</span>
                    <span className="w-20 text-center">Target</span>
                    <span className="w-20 text-center">Baseline</span>
                    <span className="w-20 text-center">Planned</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {forecastResult.goals.map((g) => (
                      <div key={g.goal_id} className="flex items-center">
                        <span className="flex-1 text-muted">{g.goal_id}</span>
                        <span className="w-20 text-center text-text">{money(g.current_savings)}</span>
                        <span className="w-20 text-center text-text">{money(g.target)}</span>
                        <span className="w-20 text-center text-text">{g.baseline_progress}%</span>
                        <span className="w-20 text-center text-accent font-medium">{g.planned_progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Model Fit */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Model Fit</h3>
              <div className="bg-[#262626] rounded-lg p-3 text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-muted">Income R²</span>
                  <span className="text-text">{forecastResult.model_fit.income_r2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Spending R²</span>
                  <span className="text-text">{forecastResult.model_fit.spending_r2}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

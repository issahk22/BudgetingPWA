"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = "http://localhost:8000";

function formatType(type) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WhatIf() {
  const [shiftTypes, setShiftTypes] = useState([]);

  //minimum months of history required before the models can run
  const [sufficiency, setSufficiency] = useState(null);

  // Hindsight
  const [hindsightForm, setHindsightForm] = useState({ month: "", year: "" });
  const [cfHours, setCfHours] = useState({});
  const [monthSummary, setMonthSummary] = useState(null);
  const [hindsightResult, setHindsightResult] = useState(null);
  const [hindsightError, setHindsightError] = useState(null);
  const [hindsightLoading, setHindsightLoading] = useState(false);

  // forecasting
  const [forecastHours, setForecastHours] = useState({});
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastError, setForecastError] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // fetch shift types + sufficiency on mount, initialise both hour dicts
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
  }, []);

  // fetch month summary when month + year filled (for hindsight)
  useEffect(() => {
    if (!hindsightForm.month || !hindsightForm.year) {
      setMonthSummary(null);
      return;
    }
    fetch(`${API}/counterfactual/month-summary/${hindsightForm.year}/${hindsightForm.month}`)
      .then((r) => r.json())
      .then((data) => setMonthSummary(Object.keys(data).length ? data : null))
      .catch(() => setMonthSummary(null));
  }, [hindsightForm.month, hindsightForm.year]);

  // Hindsight submit
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

  // Forecasting submit
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

  // not enough months of history to run the models
  if (sufficiency && !sufficiency.sufficient) {
    const monthsShort = Math.max(0, (sufficiency.minimum_required || 0) - (sufficiency.months_available || 0));
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card bg-[#323232] border border-border rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-text mb-4">Locked</h2>

          {sufficiency.error ? (
            <p className="text-muted text-sm">{sufficiency.error}</p>
          ) : (
            <>
              <p className="text-muted text-sm mb-3">
                The What If models need at least{" "}
                <span className="text-text font-semibold">6 months</span> of closed history to run.
              </p>
              
              
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "650px" }}>
      <Link href="/dashboard">Back to Dashboard</Link>
      <h1>What If?</h1>

      {/*Hindsight */}
      <h2>Hindsight</h2>
      

      <form onSubmit={handleHindsightSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>

        <label>
          Month (1-12)
          <input type="number" required min="1" max="12" value={hindsightForm.month}
            onChange={(e) => setHindsightForm({ ...hindsightForm, month: e.target.value })} />
        </label>

        <label>
          Year
          <input type="number" required min="2020" value={hindsightForm.year}
            onChange={(e) => setHindsightForm({ ...hindsightForm, year: e.target.value })} />
        </label>

        {/* actual month summary */}
        {monthSummary && monthSummary.hours && (
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%", marginTop: "0.25rem" }}>
            <tbody>
              {Object.entries(monthSummary.hours).map(([type, hrs]) => (
                <tr key={type}><td>{formatType(type)} Hours</td><td>{hrs}h</td></tr>
              ))}
              <tr><td>Income</td><td>£{parseFloat(monthSummary.income).toFixed(2)}</td></tr>
              <tr><td>Total Spent</td><td>£{parseFloat(monthSummary.total_spent).toFixed(2)}</td></tr>
              <tr><td>Left Over</td><td>£{parseFloat(monthSummary.left_over).toFixed(2)}</td></tr>
            </tbody>
          </table>
        )}

        {!monthSummary && hindsightForm.month && hindsightForm.year && (
          <p style={{ color: "grey" }}>No data found for this month.</p>
        )}

        {/* counterfactual hour inputs */}
        {shiftTypes.map((type) => (
          <label key={type}>
            Counterfactual {formatType(type)} Hours
            <input type="number" required min="0" step="0.5" value={cfHours[type] || ""}
              onChange={(e) => setCfHours({ ...cfHours, [type]: e.target.value })} />
          </label>
        ))}

        <button type="submit" disabled={hindsightLoading}>
          {hindsightLoading ? "Calculating..." : "Run Hindsight"}
        </button>
      </form>

      {hindsightError && <p style={{ color: "red", marginTop: "1rem" }}>{hindsightError}</p>}

      {hindsightResult && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Actual ({String(hindsightForm.month).padStart(2, "0")}/{hindsightForm.year})</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {hindsightResult.actual.hours && Object.entries(hindsightResult.actual.hours).map(([type, hrs]) => (
                <tr key={type}><td>{formatType(type)} Hours</td><td>{hrs}h</td></tr>
              ))}
              <tr><td>Income</td><td>£{hindsightResult.actual.income.toFixed(2)}</td></tr>
              <tr><td>Total Spent</td><td>£{hindsightResult.actual.total_spent.toFixed(2)}</td></tr>
              <tr><td>Left Over</td><td>£{hindsightResult.actual.left_over.toFixed(2)}</td></tr>
            </tbody>
          </table>



          <h3 style={{ marginTop: "1rem" }}>Counterfactual</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr><th></th><th>Estimate</th><th>95% CI</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Income</td>
                <td>£{hindsightResult.counterfactual.cf_income.toFixed(2)}</td>
                <td>£{hindsightResult.distribution.income.p2_5} – £{hindsightResult.distribution.income.p97_5}</td>
              </tr>
              <tr>
                <td>Total Spent</td>
                <td>£{hindsightResult.counterfactual.cf_spent.toFixed(2)}</td>
                <td>£{hindsightResult.distribution.spending.p2_5} – £{hindsightResult.distribution.spending.p97_5}</td>
              </tr>
              <tr>
                <td>Left Over</td>
                <td>£{hindsightResult.counterfactual.cf_left_over.toFixed(2)}</td>
                <td>£{hindsightResult.distribution.left_over.p2_5} – £{hindsightResult.distribution.left_over.p97_5}</td>
              </tr>
            </tbody>
          </table>



          <h3 style={{ marginTop: "1rem" }}>Model Fit</h3>

          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr><td>Income R²</td><td>{hindsightResult.model_fit.income_r2}</td></tr>
              <tr><td>Spending R²</td><td>{hindsightResult.model_fit.spending_r2}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />



      {/* forecasting */}
      <h2>Forecasting</h2>
      


      <form onSubmit={handleForecastSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>

        {/* planned hour inputs  (one per shift type) */}
        {shiftTypes.map((type) => (
          <label key={type}>
            Planned {formatType(type)} Hours
            <input type="number" required min="0" step="0.5" value={forecastHours[type] || ""}
              onChange={(e) => setForecastHours({ ...forecastHours, [type]: e.target.value })} />
          </label>
        ))}

        <button type="submit" disabled={forecastLoading}>
          {forecastLoading ? "Calculating..." : "Run Forecast"}
        </button>
      </form>

      {forecastError && <p style={{ color: "red", marginTop: "1rem" }}>{forecastError}</p>}

      {forecastResult && (
        <div style={{ marginTop: "2rem" }}>

          {/* baseline vs planned income/spending */}
          <h3>Baseline vs Planned</h3>

          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr><th></th><th>Baseline (avg month)</th><th>Planned</th></tr>
            </thead>
            <tbody>

              {shiftTypes.map((t) => (
                <tr key={t}>
                  <td>{formatType(t)} Hours</td>
                  <td>{forecastResult.baseline.hours[t] ?? 0}h</td>
                  <td>{forecastResult.planned.hours[t] ?? 0}h</td>
                </tr>
                
              ))}
              <tr><td>Income</td><td>£{forecastResult.baseline.income.toFixed(2)}</td><td>£{forecastResult.planned.income.toFixed(2)}</td></tr>
              <tr><td>Fixed Costs</td><td>£{forecastResult.baseline.fixed_costs.toFixed(2)}</td><td>£{forecastResult.planned.fixed_costs.toFixed(2)}</td></tr>
              <tr><td>Envelope Spending</td><td>£{forecastResult.baseline.envelope_spending.toFixed(2)}</td><td>£{forecastResult.planned.envelope_spending.toFixed(2)}</td></tr>
              <tr><td>Available to Save</td><td>£{forecastResult.baseline.available_to_save.toFixed(2)}</td><td>£{forecastResult.planned.available_to_save.toFixed(2)}</td></tr>
              <tr><td>Goal Contribution</td><td>£{forecastResult.baseline.goal_contribution.toFixed(2)}</td><td>£{forecastResult.planned.goal_contribution.toFixed(2)}</td></tr>
            </tbody>
          </table>



          
          {forecastResult.distribution && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Planned — 95% Confidence Interval</h3>
              <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr><th></th><th>Lower (p2.5)</th><th>Median (p50)</th><th>Upper (p97.5)</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Income</td>
                    <td>£{forecastResult.distribution.income.p2_5}</td>
                    <td>£{forecastResult.distribution.income.p50}</td>
                    <td>£{forecastResult.distribution.income.p97_5}</td>
                  </tr>

                  <tr>
                    <td>Envelope Spending</td>
                    <td>£{forecastResult.distribution.spending.p2_5}</td>
                    <td>£{forecastResult.distribution.spending.p50}</td>
                    <td>£{forecastResult.distribution.spending.p97_5}</td>
                  </tr>

                  <tr>
                    <td>Left Over</td>
                    <td>£{forecastResult.distribution.left_over.p2_5}</td>
                    <td>£{forecastResult.distribution.left_over.p50}</td>
                    <td>£{forecastResult.distribution.left_over.p97_5}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          

          {/* goal projections */}
          {forecastResult.goals.length > 0 && (
            <>
              <h3 style={{ marginTop: "1.5rem" }}>Goal Projections</h3>
              <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr><th>Goal</th><th>Current</th><th>Target</th><th>Baseline Progress</th><th>Planned Progress</th></tr>
                </thead>
                <tbody>
                  {forecastResult.goals.map((g) => (
                    <tr key={g.goal_id}>
                      <td>{g.goal_id}</td>
                      <td>£{g.current_savings.toFixed(2)}</td>
                      <td>£{g.target.toFixed(2)}</td>
                      <td>{g.baseline_progress}%</td>
                      <td>{g.planned_progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <h3 style={{ marginTop: "1.5rem" }}>Model Fit</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr><td>Income R²</td><td>{forecastResult.model_fit.income_r2}</td></tr>
              <tr><td>Spending R²</td><td>{forecastResult.model_fit.spending_r2}</td></tr>
            </tbody>
          </table>

        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = "http://localhost:8000";

function formatType(type) {
  
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WhatIf() {
  const [shiftTypes, setShiftTypes] = useState([]);
  const [form, setForm] = useState({ month: "", year: "" });
  const [cfHours, setCfHours] = useState({});

  const [monthSummary, setMonthSummary] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // fetch available shift types on mount
  useEffect(() => {
    fetch(`${API}/counterfactual/shift-types`)
      .then((r) => r.json())
      .then((types) => {
        setShiftTypes(types);
        const initial = {};
        types.forEach((t) => (initial[t] = ""));
        setCfHours(initial);
      })
      .catch(() => {});
  }, []);

  // fetch month summary when month + year are filled
  useEffect(() => {
    if (!form.month || !form.year) {
      setMonthSummary(null);
      return;
    }
    fetch(`${API}/counterfactual/month-summary/${form.year}/${form.month}`)
      .then((r) => r.json())
      .then((data) => setMonthSummary(Object.keys(data).length ? data : null))
      .catch(() => setMonthSummary(null));
  }, [form.month, form.year]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    // build cf_hours dict with parsed numbers
    const parsedHours = {};
    shiftTypes.forEach((t) => {
      parsedHours[t] = parseFloat(cfHours[t]) || 0;
    });

    try {
      const res = await fetch(`${API}/counterfactual/hindsight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: parseInt(form.month),
          year: parseInt(form.year),
          cf_hours: parsedHours,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "650px" }}>
      <Link href="/dashboard">Back to Dashboard</Link>
      <h1>What If?</h1>
      <p>Hindsight counterfactual</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>

        <label>
          Month (1-12)
          <input type="number" required min="1" max="12" value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })} />
        </label>

        <label>
          Year
          <input type="number" required min="2020" value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })} />
        </label>

        {/* month summary */}
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

        {!monthSummary && form.month && form.year && (
          <p style={{ color: "grey" }}>No data found for this month.</p>
        )}

        {/* dynamic counterfactual hour inputs — one per shift type */}
        {shiftTypes.map((type) => (
          <label key={type}>
            Counterfactual {formatType(type)} Hours
            <input type="number" required min="0" step="0.5" value={cfHours[type] || ""}
              onChange={(e) => setCfHours({ ...cfHours, [type]: e.target.value })} />
          </label>
        ))}

        <button type="submit" disabled={loading}>
          {loading ? "Calculating..." : "Run What If"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "2rem" }}>

          <h2>Actual ({String(form.month).padStart(2, "0")}/{form.year})</h2>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {result.actual.hours && Object.entries(result.actual.hours).map(([type, hrs]) => (
                <tr key={type}><td>{formatType(type)} Hours</td><td>{hrs}h</td></tr>
              ))}
              <tr><td>Income</td><td>£{result.actual.income.toFixed(2)}</td></tr>
              <tr><td>Total Spent</td><td>£{result.actual.total_spent.toFixed(2)}</td></tr>
              <tr><td>Left Over</td><td>£{result.actual.left_over.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h2 style={{ marginTop: "1.5rem" }}>Counterfactual</h2>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr><td>Income</td><td>£{result.counterfactual.cf_income.toFixed(2)}</td></tr>
              <tr><td>Total Spent</td><td>£{result.counterfactual.cf_spent.toFixed(2)}</td></tr>
              <tr><td>Left Over</td><td>£{result.counterfactual.cf_left_over.toFixed(2)}</td></tr>
            </tbody>
          </table>

          <h2 style={{ marginTop: "1.5rem" }}>Model Fit</h2>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr><td>Income R²</td><td>{result.model_fit.income_r2}</td></tr>
              <tr><td>Spending R²</td><td>{result.model_fit.spending_r2}</td></tr>
            </tbody>
          </table>

        </div>
      )}
    </div>
  );
}

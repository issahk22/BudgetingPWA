"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const API = "http://localhost:8000";

const COLORS = {
  accent: "#00BBA8",
  negative: "#dc2626",
  muted: "#9ca3af",
  text: "#f9fafb",
  card: "#323232",
  grid: "#374151",
  income: "#00BBA8",
  spending: "#dc2626",
  allocated: "#94a3b8",
  spent: "#00BBA8",
  target: "#9ca3af",
  saved: "#00BBA8",
};

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/history/insights`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted p-6">Loading...</p>;
  if (!data || data.months?.length === 0)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-text mb-4">No Data Yet</h2>
          <p className="text-muted text-sm">Close at least one month to see insights.</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <h1 className="text-[40px] font-bold text-text inline-block border-b-4 border-accent pb-1">
        Insights
      </h1>

      {/* Income vs Spending */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-xl font-bold text-text mb-4">Income vs Spending</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.months}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 12 }} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.grid}`, borderRadius: 8 }}
              labelStyle={{ color: COLORS.text }}
              formatter={(v) => `£${v.toFixed(2)}`}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="spending" stroke={COLORS.spending} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Goal Progress */}
      {data.goals.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xl font-bold text-text mb-4">Savings Goal Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.goals}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 12 }} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.grid}`, borderRadius: 8 }}
                labelStyle={{ color: COLORS.text }}
                formatter={(v) => `£${v.toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="target" stroke={COLORS.target} strokeWidth={2} strokeDasharray="6 3" dot={false} />
              <Line type="monotone" dataKey="saved" stroke={COLORS.saved} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Envelope Allocated vs Spent */}
      {data.envelopes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xl font-bold text-text mb-4">Envelope Budget vs Spent (Latest Month)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.envelopes}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 12 }} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.grid}`, borderRadius: 8 }}
                labelStyle={{ color: COLORS.text }}
                formatter={(v) => `£${v.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="allocated" name="Allocated" fill={COLORS.allocated} radius={[4, 4, 0, 0]} activeBar={false} />
              <Bar dataKey="spent" name="Spent" fill={COLORS.spent} radius={[4, 4, 0, 0]} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Card from "../../components/Card";

const API = "http://localhost:8000";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
];

//converts month no. + year to month name and year
function formatMonth(month, year) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

//converts shift types into readable lines for user night_shift -> Night Shift 
function formatShiftType(type) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}


//converts money into being readable for user. money(500) -> £500
function money(v) {
  return `£${parseFloat(v).toFixed(2)}`;
}



export default function History() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState(null); // "YYYY-MM" of the currently expanded month
  const [details, setDetails] = useState({});   // cache for already fetched month details 
  const [detailLoading, setDetailLoading] = useState(false);

  
  useEffect(() => {
    async function fetchMonths() {
      try {
        const res = await fetch(`${API}/history/months`); 
        const data = await res.json();
        setMonths(data); //fetches month summary objects from backend and then stores in a state 
      } catch (err) {
        console.error("Failed to load history:", err); //catch if fails 
      } finally {
        setLoading(false); //failsafe if no backend 
      }
    }
    fetchMonths();
  }, []); //only runs once when page loads 

  //loads a detailed breakdown for month on first click, then caches it
  async function toggleMonth(year, month) {

    //toggle logic
    const key = `${year}-${month}`;
    if (openKey === key) {
      setOpenKey(null); //if key is already open set it to null to close 
      return;
    }
    setOpenKey(key);  

    if (details[key]) return; // already cached, skip details fetch 

    setDetailLoading(true);
    try {
      const [envRes, shiftRes, fcRes, goalRes] = await Promise.all([
        fetch(`${API}/history/envelopes/${year}/${month}`),
        fetch(`${API}/history/shifts/${year}/${month}`),
        fetch(`${API}/history/fixed-costs/${year}/${month}`),
        fetch(`${API}/history/goals/${year}/${month}`),
      ]);

      //parses everything fetched to json 
      const [envelopes, shifts, fixedCosts, goals] = await Promise.all([
        envRes.json(), shiftRes.json(), fcRes.json(), goalRes.json(),
      ]);
      //saves fetched details to cache
      setDetails((prev) => ({ ...prev, [key]: { envelopes, shifts, fixedCosts, goals } }));
    } catch (err) {
      console.error("Failed to load month details:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <p className="text-muted text-lg">Loading...</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[40px] font-bold text-text mb-1 inline-block border-b-4 border-accent pb-1">History</h1>
        <p className="text-sm text-muted mt-3">Click a month to see the full breakdown.</p>
      </div>

      {months.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No history yet. Close your first month from the dashboard to start building history.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 max-w-4xl">
          {months.map((m) => {
            const key = `${m.year}-${m.month}`;
            const isOpen = openKey === key;
            const detail = details[key];
            const netIncome = parseFloat(m.actual_net_income);
            const totalSpent = parseFloat(m.total_spent);
            const leftover = netIncome - totalSpent;

            return (
              <Card key={key}>
                {/* Month header + summary view */}
                <button
                  onClick={() => toggleMonth(m.year, m.month)}
                  className="w-full text-left focus:outline-none"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-[22px] font-bold text-text font-[var(--font-inter)]">
                        {formatMonth(m.month, m.year)}
                      </h2>
                      <p className="text-xs text-muted mt-1">
                        {m.shifts_worked} shifts · {parseFloat(m.hours_worked).toFixed(0)}h worked
                      </p>
                    </div>
                    <span className="text-muted text-xs mt-2">{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* Summary stat grid */}
                  <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted">Net Income</p>
                      <p className="text-accent font-semibold">{money(m.actual_net_income)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Total Spent</p>
                      <p className="text-text font-semibold">{money(m.total_spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Leftover</p>
                      <p className={leftover < 0 ? "text-negative font-semibold" : "text-text font-semibold"}>
                        {money(leftover)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Closing Balance</p>
                      <p className="text-text font-semibold">{money(m.accounts_closing_balance)}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded breakdown */}
                {isOpen && (
                  <div className="mt-5 border-t border-gray-700 pt-4">
                    {detailLoading && !detail ? (
                      <p className="text-sm text-muted">Loading...</p>
                    ) : detail ? (
                      <div className="flex flex-col gap-4">

                        {/* Opening / closing + income breakdown */}
                        <div className="bg-[#262626] rounded-lg p-3 grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">Opening balance</span>
                            <span className="text-text">{money(m.accounts_opening_balance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Closing balance</span>
                            <span className="text-text">{money(m.accounts_closing_balance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Shift income (gross)</span>
                            <span className="text-text">{money(m.shift_calculated_income)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Actual net income</span>
                            <span className="text-text">{money(m.actual_net_income)}</span>
                          </div>
                        </div>

                        {/* Envelopes */}
                        <div>
                          <h3 className="text-sm font-semibold text-text mb-2">Envelopes</h3>
                          {detail.envelopes.length === 0 ? (
                            <p className="text-xs text-muted">No envelope data.</p>
                          ) : (
                            <ul className="divide-y divide-gray-700 text-sm">
                              {detail.envelopes.map((env) => {
                                const allocated = parseFloat(env.allocated_amount);
                                const spent = parseFloat(env.actual_spent);
                                const pct = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;
                                return (
                                  <li key={env.envelope_name} className="py-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-text">
                                        {env.envelope_name}
                                        {env.overspent && (
                                          <span className="ml-2 text-xs text-negative">overspent</span>
                                        )}
                                      </span>
                                      <span className="text-muted text-xs">
                                        {money(spent)} / {money(allocated)}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-800 rounded">
                                      <div
                                        className={`h-full rounded ${env.overspent ? "bg-negative" : "bg-accent"}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        {/* Fixed costs */}
                        <div>
                          <h3 className="text-sm font-semibold text-text mb-2">Fixed Costs</h3>
                          {detail.fixedCosts.length === 0 ? (
                            <p className="text-xs text-muted">No fixed costs.</p>
                          ) : (
                            <ul className="divide-y divide-gray-700 text-sm">
                              {detail.fixedCosts.map((fc) => (
                                <li key={fc.cost_name} className="py-2 flex justify-between">
                                  <span className="text-text">{fc.cost_name}</span>
                                  <span className="flex items-center gap-3">
                                    <span className="text-text">{money(fc.amount)}</span>
                                    <span className={`text-xs ${fc.was_paid ? "text-accent" : "text-negative"}`}>
                                      {fc.was_paid ? "paid" : "unpaid"}
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Shifts */}
                        <div>
                          <h3 className="text-sm font-semibold text-text mb-2">
                            Shifts <span className="text-xs text-muted font-normal">({detail.shifts.length})</span>
                          </h3>
                          {detail.shifts.length === 0 ? (
                            <p className="text-xs text-muted">No shifts.</p>
                          ) : (
                            <ul className="divide-y divide-gray-700 text-sm">
                              {detail.shifts.map((s) => (
                                <li key={s.id} className="py-2 flex justify-between">
                                  <span className="text-text">
                                    {s.date}
                                    <span className="text-xs text-muted ml-2">
                                      · {formatShiftType(s.shift_type)} · {parseFloat(s.hours_worked).toFixed(1)}h · x{parseFloat(s.rate_multiplier).toFixed(3)}
                                    </span>
                                  </span>
                                  <span className="text-text font-medium">{money(s.total_pay)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Goals / pots */}
                        <div>
                          <h3 className="text-sm font-semibold text-text mb-2">Savings Goals</h3>
                          {detail.goals.length === 0 ? (
                            <p className="text-xs text-muted">No goals.</p>
                          ) : (
                            <ul className="divide-y divide-gray-700 text-sm">
                              {detail.goals.map((g) => {
                                const saved = parseFloat(g.amount_at_month_end);
                                const target = parseFloat(g.target_amount);
                                const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
                                return (
                                  <li key={g.goal_id} className="py-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-text">
                                        {money(saved)} / {money(target)}
                                      </span>
                                      <span className={`text-xs ${g.on_track ? "text-accent" : "text-negative"}`}>
                                        {g.on_track ? "on track" : "off track"}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-800 rounded">
                                      <div
                                        className={`h-full rounded ${g.on_track ? "bg-accent" : "bg-negative"}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                      </div>
                    ) : (
                      <p className="text-sm text-muted">No details available.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

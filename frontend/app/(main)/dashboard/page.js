"use client";

import { useState, useEffect } from "react";
import Card from "../../components/Card";

const API = "http://localhost:8000";


export default function Dashboard() {

  const [accounts, setAccounts] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [transactions, setTransactions] = useState({});
  const [openEnvelopes, setOpenEnvelopes] = useState(new Set());
  const [openAccountLogs, setOpenAccountLogs] = useState(new Set());

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ envelope_id: "", account_id: "", amount: "", description: "", date: "" });
  const [submitting, setSubmitting] = useState(false);

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferForm, setTransferForm] = useState({ from_account_id: "", to_account_id: "", amount: "", date: "", description: "" });
  const [transferring, setTransferring] = useState(false);

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftForm, setShiftForm] = useState({ job_id: "", date: "", hours_worked: "", shift_type: "", rate_multiplier: "" });
  const [submittingShift, setSubmittingShift] = useState(false);
  const [shiftTypes, setShiftTypes] = useState([]);

  //controls the + dropdown menu visibility
  const [showAddMenu, setShowAddMenu] = useState(false);

  //end month flow: modal visibility, net income input, and loading state
  const [showEndMonth, setShowEndMonth] = useState(false);
  const [netIncome, setNetIncome] = useState("");
  const [closingMonth, setClosingMonth] = useState(false);

  //post month close allocations modal: envelope amounts, ML recommendations, and loading state
  const [showAllocations, setShowAllocations] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [savingAllocations, setSavingAllocations] = useState(false);

  // tracks which month the dashboard is currently viewing (defaults to current month)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, envelopesRes, fixedCostsRes, transfersRes, jobsRes, shiftsRes, shiftTypesRes] = await Promise.all([
          fetch(`${API}/accounts`),
          fetch(`${API}/envelopes`),
          fetch(`${API}/fixed-costs`),
          fetch(`${API}/transfers`),
          fetch(`${API}/jobs`),
          fetch(`${API}/shifts`),
          fetch(`${API}/shift-types`),
        ]);

        const accountsData = await accountsRes.json();
        const envelopesData = await envelopesRes.json();
        const fixedCostsData = await fixedCostsRes.json();
        const transfersData = await transfersRes.json();
        const jobsData = await jobsRes.json();
        const shiftsData = await shiftsRes.json();
        const shiftTypesData = await shiftTypesRes.json();

        setAccounts(accountsData);
        setEnvelopes(envelopesData);
        setFixedCosts(fixedCostsData);
        setTransfers(transfersData);
        setJobs(jobsData);
        setShifts(shiftsData);
        setShiftTypes(shiftTypesData);

        if (envelopesData.length > 0) {
          const txResults = await Promise.all(
            envelopesData.map((env) =>
              fetch(`${API}/transactions/envelope/${env.id}`).then((r) => r.json())
            )
          );
          const txMap = {};
          envelopesData.forEach((env, i) => { txMap[env.id] = txResults[i]; });
          setTransactions(txMap);
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);



  const totalBalance = accounts
    .filter((acc) => acc.include_in_budget)
    .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  const viewMonthLabel = viewDate.toLocaleString("default", { month: "long", year: "numeric" });

  //If there is at least 1 month history, a back button will appear
  const hasHistory = shifts.some((s) => s.date && new Date(s.date) < viewDate) ||
    Object.values(transactions).flat().some((tx) => tx.date && new Date(tx.date) < viewDate);

  // hides the forward arrow when already on the current month
  const isCurrentMonth = (() => {
    const now = new Date();
    return viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
  })();

  // navigate back one month
  function goBack() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  // navigate forward one month (only shown when not on current month)
  function goForward() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }


  async function handlePaidToggle(cost) {
    const newPaid = !cost.paid;
    const amount = parseFloat(cost.amount);

    await fetch(`${API}/fixed-costs/${cost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });



    const bankAccount = accounts.find((a) => a.include_in_budget);
    if (bankAccount) {
      const newBalance = newPaid
        ? parseFloat(bankAccount.balance) - amount
        : parseFloat(bankAccount.balance) + amount;

      await fetch(`${API}/accounts/${bankAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });

      setAccounts((prev) =>
        prev.map((acc) => acc.id === bankAccount.id ? { ...acc, balance: newBalance } : acc)
      );
    }

    setFixedCosts((prev) =>
      prev.map((c) => c.id === cost.id ? { ...c, paid: newPaid } : c)
    );
  }




  function toggleEnvelopeLog(envId) {
    setOpenEnvelopes((prev) => {
      const next = new Set(prev);
      next.has(envId) ? next.delete(envId) : next.add(envId);
      return next;
    });
  }




  function toggleAccountLog(accountId) {
    setOpenAccountLogs((prev) => {
      const next = new Set(prev);
      next.has(accountId) ? next.delete(accountId) : next.add(accountId);
      return next;
    });
  }


  function getAccountTransfers(accountId) {
    return transfers.filter(
      (t) => t.from_account_id === accountId || t.to_account_id === accountId
    );
  }



  function getAccountName(accountId) {
    return accounts.find((a) => a.id === accountId)?.account_name || "Unknown";
  }




  async function handleAddTransaction(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const txRes = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelope_id: form.envelope_id,
          amount: parseFloat(form.amount),
          description: form.description || null,
          date: form.date || null,
        }),
      });
      const newTx = await txRes.json();

      const account = accounts.find((a) => a.id === form.account_id);
      if (account) {
        const newBalance = parseFloat(account.balance) - parseFloat(form.amount);
        await fetch(`${API}/accounts/${account.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance }),
        });
        setAccounts((prev) =>
          prev.map((a) => a.id === account.id ? { ...a, balance: newBalance } : a)
        );
      }

      setEnvelopes((prev) =>
        prev.map((env) =>
          env.id === form.envelope_id
            ? { ...env, balance: parseFloat(env.balance) - parseFloat(form.amount) }
            : env
        )
      );

      setTransactions((prev) => ({
        ...prev,
        [form.envelope_id]: [newTx, ...(prev[form.envelope_id] || [])],
      }));

      setForm({ envelope_id: "", account_id: "", amount: "", description: "", date: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add transaction:", err);
    } finally {
      setSubmitting(false);
    }
  }


  async function handleTransfer(e) {
    e.preventDefault();
    setTransferring(true);

    try {
      const res = await fetch(`${API}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_account_id: transferForm.from_account_id,
          to_account_id: transferForm.to_account_id,
          amount: parseFloat(transferForm.amount),
          date: transferForm.date || null,
          description: transferForm.description || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Transfer failed:", err.detail);
        return;
      }

      const newTransfer = await res.json();
      const amount = parseFloat(transferForm.amount);

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === transferForm.from_account_id) return { ...acc, balance: parseFloat(acc.balance) - amount };
          if (acc.id === transferForm.to_account_id) return { ...acc, balance: parseFloat(acc.balance) + amount };
          return acc;
        })
      );

      setTransfers((prev) => [newTransfer, ...prev]);
      setTransferForm({ from_account_id: "", to_account_id: "", amount: "", date: "", description: "" });
      setShowTransferForm(false);
    } catch (err) {
      console.error("Failed to create transfer:", err);
    } finally {
      setTransferring(false);
    }
  }



  async function handleLogShift(e) {
    e.preventDefault();
    setSubmittingShift(true);

    try {
      const res = await fetch(`${API}/shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: shiftForm.job_id,
          date: shiftForm.date || null,
          hours_worked: parseFloat(shiftForm.hours_worked),
          shift_type: shiftForm.shift_type,
          rate_multiplier: shiftForm.rate_multiplier ? parseFloat(shiftForm.rate_multiplier) : 1.0,
        }),
      });

      const newShift = await res.json();
      setShifts((prev) => [newShift, ...prev]);
      setShiftForm({ job_id: "", date: "", hours_worked: "", shift_type: "", rate_multiplier: "" });
      setShowShiftForm(false);
    } catch (err) {
      console.error("Failed to log shift:", err);
    } finally {
      setSubmittingShift(false);
    }
  }


  function getJobName(jobId) {
    return jobs.find((j) => j.job_id === jobId)?.job_name || "Unknown";
  }

  function formatShiftType(type) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const totalMonthlyPay = shifts.reduce((sum, s) => sum + parseFloat(s.total_pay), 0);

  //closes the current month, archives data to history db and resets live DB for the new month
  async function handleEndMonth(e) {
    e.preventDefault();
    setClosingMonth(true);

    try {
      const now = new Date();
      const res = await fetch(`${API}/month-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          net_income: parseFloat(netIncome),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Month close failed:", err.detail);
        return;
      }

      const income = parseFloat(netIncome);
      setShowEndMonth(false);
      setNetIncome("");

      //refresh envelopes and accounts after reset 
      const [envsRes, accsRes] = await Promise.all([
        fetch(`${API}/envelopes`),
        fetch(`${API}/accounts`),
      ]);
      const freshEnvelopes = await envsRes.json();
      const freshAccounts = await accsRes.json();
      setEnvelopes(freshEnvelopes);
      setAccounts(freshAccounts);

      //prefill allocation inputs with current allocated amounts
      const allocs = {};
      freshEnvelopes.forEach((env) => { allocs[env.id] = parseFloat(env.allocated_amount).toFixed(2); });
      setAllocations(allocs);

      //attempt ML recommendations 
      const fixedTotal = fixedCosts.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      try {
        const recRes = await fetch(`${API}/envelopes/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ income, fixed_costs: fixedTotal, goal_contribution: 0 }),
        });
        const recData = await recRes.json();
        if (recData.recommendations) {
          setRecommendations(recData.recommendations);
        } else {
          //reccommendations column hidden if not enough history (needs >=3months)
          setRecommendations(null);
        }
      } catch {
        setRecommendations(null);
      }

      setShowAllocations(true);
    } catch (err) {
      console.error("Failed to close month:", err);
    } finally {
      setClosingMonth(false);
    }
  }


  //saves each envelope's new allocated amount for the new month, blank fields save as 0
  async function handleSaveAllocations(e) {
    e.preventDefault();
    setSavingAllocations(true);

    try {
      await Promise.all(
        envelopes.map((env) =>
          fetch(`${API}/envelopes/${env.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allocated_amount: parseFloat(allocations[env.id]) || 0 }),
          })
        )
      );

      setShowAllocations(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to save allocations:", err);
    } finally {
      setSavingAllocations(false);
    }
  }


  if (loading) return <p className="text-muted text-lg">Loading...</p>;


  return (
    <div>


        {/* Add Transaction Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowForm(false)}>
          <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={handleAddTransaction}>
            <h3 className="text-text mb-1">New Transaction</h3>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Envelope
              <select required value={form.envelope_id} onChange={(e) => setForm({ ...form, envelope_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select envelope</option>
                {envelopes.map((env) => (
                  <option key={env.id} value={env.id}>{env.envelope_name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Account
              <select required value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Amount
              <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Description (optional)
              <input type="text" maxLength={80} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <button type="submit" disabled={submitting}
              className="w-full px-4 py-2 rounded-lg bg-accent text-gray-900 font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Saving..." : "Save Transaction"}
            </button>
          </form>
          </div>
        )}


        {/* Transfer Form */}
        {showTransferForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowTransferForm(false)}>
          <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={handleTransfer}>
            <h3 className="text-text mb-1">Transfer Between Accounts</h3>

            <label className="flex flex-col gap-1 text-sm text-muted">
              From
              <select required value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              To
              <select required value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select account</option>
                {accounts
                  .filter((acc) => acc.id !== transferForm.from_account_id)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Amount
              <input type="number" required min="0.01" step="0.01" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Date
              <input type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Description (optional)
              <input type="text" maxLength={80} value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <button type="submit" disabled={transferring}
              className="w-full px-4 py-2 rounded-lg bg-accent text-gray-900 font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {transferring ? "Transferring..." : "Confirm Transfer"}
            </button>
          </form>
          </div>
        )}


        {/* Add Shift  */}
        {showShiftForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowShiftForm(false)}>
          <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={handleLogShift}>
            <h3 className="text-text mb-1">Log Shift</h3>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Job
              <select required value={shiftForm.job_id} onChange={(e) => setShiftForm({ ...shiftForm, job_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select job</option>
                {jobs.map((job) => (
                  <option key={job.job_id} value={job.job_id}>{job.job_name} — £{parseFloat(job.base_hourly_rate).toFixed(2)}/hr</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Date
              <input type="date" required value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Hours Worked
              <input type="number" required min="0.5" step="0.5" value={shiftForm.hours_worked} onChange={(e) => setShiftForm({ ...shiftForm, hours_worked: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Shift Type
              <select required value={shiftForm.shift_type} onChange={(e) => setShiftForm({ ...shiftForm, shift_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Select shift type</option>
                {shiftTypes.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Rate Multiplier (optional)
              <input type="number" min="1" step="0.05" placeholder="e.g. 1.5" value={shiftForm.rate_multiplier} onChange={(e) => setShiftForm({ ...shiftForm, rate_multiplier: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <button type="submit" disabled={submittingShift}
              className="w-full px-4 py-2 rounded-lg bg-accent text-gray-900 font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submittingShift ? "Saving..." : "Log Shift"}
            </button>
          </form>
          </div>
        )}


        {/* End Month */}
        {showEndMonth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowEndMonth(false)}>
          <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={handleEndMonth}>
            <h3 className="text-text mb-1">End Month</h3>
            <p className="text-sm text-muted">This will close the current month and archive all data to history.</p>

            <label className="flex flex-col gap-1 text-sm text-muted">
              Net Income (for next month)
              <input type="number" required min="0" step="0.01" value={netIncome} onChange={(e) => setNetIncome(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </label>

            <button type="submit" disabled={closingMonth}
              className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {closingMonth ? "Closing..." : "Confirm End Month"}
            </button>
          </form>
          </div>
        )}



        {/* Envelope allocations post end month */}
        {showAllocations && (() => {
          const primaryAccount = accounts.find((a) => a.include_in_budget);
          const accountBalance = primaryAccount ? parseFloat(primaryAccount.balance) : 0;
          const fixedTotal = fixedCosts.reduce((sum, c) => sum + parseFloat(c.amount), 0);
          const availableBudget = accountBalance - fixedTotal;
          const allocatedSum = Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
          const remaining = availableBudget - allocatedSum;
          const isNegativeAvailable = availableBudget < 0;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowAllocations(false)}>
            <form className="bg-card border border-border rounded-xl p-5 w-full max-w-lg flex flex-col gap-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} onSubmit={handleSaveAllocations}>
              <h3 className="text-text mb-1">Envelope Allocations</h3>

              {/* Budget summary */}
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Account balance</span>
                  <span className="text-text">£{accountBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fixed costs</span>
                  <span className="text-negative">-£{fixedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1 font-medium">
                  <span className="text-muted">Available to budget</span>
                  <span className={isNegativeAvailable ? "text-negative" : "text-text"}>£{availableBudget.toFixed(2)}</span>
                </div>
                {!isNegativeAvailable && (
                  <div className="flex justify-between">
                    <span className="text-muted">Remaining unallocated</span>
                    <span className={remaining < 0 ? "text-negative" : "text-accent"}>£{remaining.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {isNegativeAvailable ? (
                <p className="text-sm text-negative">Your fixed costs exceed your account balance. Resolve this before setting allocations.</p>
              ) : (
                <>
                  <div className="flex text-xs text-muted font-medium border-b border-gray-700 pb-1 mb-1">
                    <span className="flex-1">Envelope</span>
                    <span className="w-28 text-right">Amount (£)</span>
                    {recommendations && <span className="w-32 text-right text-accent">Recommended (£)</span>}
                  </div>

                  {envelopes.map((env) => (
                    <div key={env.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-text">{env.envelope_name}</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={allocations[env.id] ?? ""}
                        onChange={(e) => setAllocations((prev) => ({ ...prev, [env.id]: e.target.value }))}
                        className="w-28 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      {recommendations && (
                        <span className="w-32 text-right text-sm text-accent">
                          {recommendations[env.envelope_name] !== undefined
                            ? `£${recommendations[env.envelope_name].toFixed(2)}`
                            : "—"}
                        </span>
                      )}
                    </div>
                  ))}

                  {recommendations && (
                    <p className="text-xs text-muted">Recommendations based on your spending history.</p>
                  )}

                  <button type="submit" disabled={savingAllocations}
                    className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                    {savingAllocations ? "Saving..." : "Save Allocations"}
                  </button>
                </>
              )}
            </form>
            </div>
          );
        })()}




        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[40px] font-bold text-text mb-1 inline-block border-b-4 border-accent pb-1">Dashboard</h1>

          <div className="flex items-center gap-2 mt-6 mb-5">
            {hasHistory && (
              <button onClick={goBack} className="text-muted hover:text-accent transition-colors text-[28px] font-bold leading-none">‹</button>
            )}
            <span className="text-[28px] font-bold text-[#00BBA8] font-[var(--font-inter)]">{viewMonthLabel}</span>
            {!isCurrentMonth && (
              <button onClick={goForward} className="text-muted hover:text-accent transition-colors text-[28px] font-bold leading-none">›</button>
            )}
          </div>

          <div className="flex items-center gap-3">

            <div className="relative">
              <button
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-accent text-white hover:bg-accent-hover"
                onClick={() => setShowAddMenu((v) => !v)}
              >
                +
              </button>

            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                <div className="absolute left-0 top-full mt-2 z-20 bg-[#323232] border border-border rounded-xl overflow-hidden shadow-[0_8px_30px_6px_rgba(0,0,0,0.85)] min-w-[160px]">
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-gray-700/50 transition-colors"
                    onClick={() => { setShowForm(true); setShowTransferForm(false); setShowShiftForm(false); setShowAddMenu(false); }}
                  >
                    Add Transaction
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-gray-700/50 transition-colors"
                    onClick={() => { setShowTransferForm(true); setShowForm(false); setShowShiftForm(false); setShowAddMenu(false); }}
                  >
                    Transfer
                  </button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-gray-700/50 transition-colors"
                    onClick={() => { setShowShiftForm(true); setShowForm(false); setShowTransferForm(false); setShowAddMenu(false); }}
                  >
                    Add Shift
                  </button>
                </div>
              </>
            )}
            </div>

            <button
              className="px-4 py-2 rounded-lg font-medium text-sm border border-red-600 text-red-500 bg-black hover:bg-red-950 transition-colors"
              onClick={() => setShowEndMonth(true)}
            >
              End Month
            </button>

          </div>

        </div>

        {/* 2 Column layoug */}
        <div className="grid grid-cols-[7fr_3fr] gap-10 items-start">

          {/* Left */}
          <div>

            {/* Envelope Cards Grid */}
            <h2 className="text-[28px] font-bold text-text font-[var(--font-inter)] mb-2">Envelopes</h2>
            <div className="h-[1.5px] w-full bg-[#262626] mb-4"></div>
            {envelopes.length === 0 ? (
              <p className="text-sm text-muted mb-6">No envelopes found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {envelopes.map((env) => {
                  const isOpen = openEnvelopes.has(env.id);
                  const envTxs = transactions[env.id] || [];
                  const balance = parseFloat(env.balance);
                  const allocated = parseFloat(env.allocated_amount);
                  const pct = allocated > 0 ? Math.max(0, Math.min(100, (balance / allocated) * 100)) : 0;

                  return (
                    <Card key={env.id} className="p-4 self-start">
                      <div
                        className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleEnvelopeLog(env.id)}
                      >
                        <span className="text-[25px] font-bold text-text">{env.envelope_name}</span>
                        <span className="text-xs text-muted">{isOpen ? "▲" : "▼"}</span>
                      </div>

                      <p className="text-[36px] font-bold text-white mt-1 font-[var(--font-inter)]">
                        £{balance.toFixed(2)} <span className="text-sm font-normal text-muted">/ £{allocated.toFixed(2)}</span>
                      </p>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2">
                        <div
                          className={`h-1.5 rounded-full ${pct > 20 ? "bg-accent" : "bg-negative"}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          {envTxs.length === 0 ? <p className="text-xs text-muted">No transactions yet.</p> : (
                            <ul>
                              {envTxs.map((tx) => (
                                <li key={tx.id} className="py-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted">{tx.description || "—"}</span>
                                    <span className="text-negative">-£{parseFloat(tx.amount).toFixed(2)}</span>
                                  </div>
                                  {tx.date && <p className="text-xs text-muted">{tx.date}</p>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">

            {/* Accounts Summary */}
            <Card className="w-full">
              <h2 className="text-text mb-1">Accounts</h2>
              <p className="text-2xl font-bold text-white mb-3">£{totalBalance.toFixed(2)}</p>

              {accounts.length === 0 ? <p className="text-sm text-muted">No accounts found.</p> : (
                <ul className="space-y-0">
                  {[...accounts].sort((a, b) => (b.include_in_budget ? 1 : 0) - (a.include_in_budget ? 1 : 0)).map((acc) => {
                    const isOpen = openAccountLogs.has(acc.id);
                    const accTransfers = getAccountTransfers(acc.id);
                    return (
                      <li key={acc.id}>
                        <div
                          className="flex justify-between items-center py-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors"
                          onClick={() => toggleAccountLog(acc.id)}
                        >
                          <span className="text-sm text-text">
                            {acc.account_name} <span className="text-xs text-muted">({acc.account_type})</span>
                          </span>
                          <span className="text-sm text-text font-medium">
                            £{parseFloat(acc.balance).toFixed(2)} <span className="text-xs text-muted">{isOpen ? "▲" : "▼"}</span>
                          </span>
                        </div>

                        {isOpen && (
                          <div className="pl-3 mt-2 mb-2 border-l-2 border-border">
                            <p className="text-xs text-muted mb-1">Transfer Log</p>
                            {accTransfers.length === 0 ? <p className="text-xs text-muted">No transfers yet.</p> : (
                              <ul>
                                {accTransfers.map((t) => {
                                  const isOutgoing = t.from_account_id === acc.id;
                                  return (
                                    <li key={t.id} className="py-1">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted">
                                          {isOutgoing ? `→ ${getAccountName(t.to_account_id)}` : `← ${getAccountName(t.from_account_id)}`}
                                          {t.description ? ` · ${t.description}` : ""}
                                        </span>
                                        <span className={isOutgoing ? "text-negative" : "text-positive"}>
                                          {isOutgoing ? "-" : "+"}£{parseFloat(t.amount).toFixed(2)}
                                        </span>
                                      </div>
                                      {t.date && <p className="text-xs text-muted">{t.date}</p>}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Monthly Costs + Shifts */}
            <div className="grid grid-cols-2 gap-4">

              {/* Monthly Costs */}
              <Card>
                <h2 className="text-text mb-3">Monthly Costs</h2>

                {fixedCosts.length === 0 ? <p className="text-sm text-muted">No fixed costs found.</p> : (
                  <ul>
                    {fixedCosts.map((cost) => (
                      <li key={cost.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                        <span className="text-sm text-text">{cost.cost_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-text font-medium">£{parseFloat(cost.amount).toFixed(2)}</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cost.paid}
                              onChange={() => handlePaidToggle(cost)}
                              className="w-4 h-4 rounded accent-accent"
                            />
                            <span className={`text-xs ${cost.paid ? "text-positive" : "text-muted"}`}>
                              {cost.paid ? "Paid" : "Unpaid"}
                            </span>
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Shifts */}
              <Card>
                <h2 className="text-text mb-1">Shifts</h2>
                <p className="text-lg font-bold text-accent mb-3">£{totalMonthlyPay.toFixed(2)} <span className="text-xs text-muted font-normal">this month</span></p>

                {shifts.length === 0 ? <p className="text-sm text-muted">No shifts logged yet.</p> : (
                  <ul>
                    {shifts.map((shift) => (
                      <li key={shift.shift_id} className="py-2 border-b border-gray-700 last:border-0">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-text">
                            {getJobName(shift.job_id)} <span className="text-xs text-muted">· {formatShiftType(shift.shift_type)}</span>
                          </span>
                          <span className="text-text font-medium">£{parseFloat(shift.total_pay).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{shift.date} · {shift.hours_worked}hrs · x{shift.rate_multiplier}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

            </div>

          </div>

        </div>

    </div>
  );
}

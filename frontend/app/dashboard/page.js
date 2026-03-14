"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

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


  if (loading) return <p>Loading...</p>;


  return (
    <div className={styles.page}>
      <h1>Dashboard</h1>
      <Link href="/whatif">What If?</Link>

      <div className={styles.actions}>
        <button className={styles.btn} onClick={() => { setShowForm((v) => !v); setShowTransferForm(false); setShowShiftForm(false); }}>
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>
        <button className={styles.btn} onClick={() => { setShowTransferForm((v) => !v); setShowForm(false); setShowShiftForm(false); }}>
          {showTransferForm ? "Cancel" : "Transfer"}
        </button>
        <button className={styles.btn} onClick={() => { setShowShiftForm((v) => !v); setShowForm(false); setShowTransferForm(false); }}>
          {showShiftForm ? "Cancel" : "+ Log Shift"}
        </button>
      </div>


      {/* Add Transaction Form */}
      {showForm && (
        <form className={styles.form} onSubmit={handleAddTransaction}>
          <h3>New Transaction</h3>

          <label>
            Envelope
            <select required value={form.envelope_id} onChange={(e) => setForm({ ...form, envelope_id: e.target.value })}>
              <option value="">Select envelope</option>
              {envelopes.map((env) => (
                <option key={env.id} value={env.id}>{env.envelope_name}</option>
              ))}
            </select>
          </label>

          <label>
            Account
            <select required value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Amount (£)
            <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>

          <label>
            Date
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>

          <label>
            Description (optional)
            <input type="text" maxLength={80} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <button className={styles.btn} type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Transaction"}</button>
        </form>
      )}


      {/* Transfer Form */}
      {showTransferForm && (
        <form className={styles.form} onSubmit={handleTransfer}>
          <h3>Transfer Between Accounts</h3>

          <label>
            From
            <select required value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}>
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            To
            <select required value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}>
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

          <label>
            Amount (£)
            <input type="number" required min="0.01" step="0.01" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} />
          </label>

          <label>
            Date
            <input type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
          </label>

          <label>
            Description (optional)
            <input type="text" maxLength={80} value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} />
          </label>

          <button className={styles.btn} type="submit" disabled={transferring}>{transferring ? "Transferring..." : "Confirm Transfer"}</button>
        </form>
      )}


      {/* Log Shift Form */}
      {showShiftForm && (
        <form className={styles.form} onSubmit={handleLogShift}>
          <h3>Log Shift</h3>

          <label>
            Job
            <select required value={shiftForm.job_id} onChange={(e) => setShiftForm({ ...shiftForm, job_id: e.target.value })}>
              <option value="">Select job</option>
              {jobs.map((job) => (
                <option key={job.job_id} value={job.job_id}>{job.job_name} — £{parseFloat(job.base_hourly_rate).toFixed(2)}/hr</option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input type="date" required value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} />
          </label>

          <label>
            Hours Worked
            <input type="number" required min="0.5" step="0.5" value={shiftForm.hours_worked} onChange={(e) => setShiftForm({ ...shiftForm, hours_worked: e.target.value })} />
          </label>

          <label>
            Shift Type
            <select required value={shiftForm.shift_type} onChange={(e) => setShiftForm({ ...shiftForm, shift_type: e.target.value })}>
              <option value="">Select shift type</option>
              {shiftTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </label>

          <label>
            Rate Multiplier (optional)
            <input type="number" min="1" step="0.05" placeholder="e.g. 1.5" value={shiftForm.rate_multiplier} onChange={(e) => setShiftForm({ ...shiftForm, rate_multiplier: e.target.value })} />
          </label>

          <button className={styles.btn} type="submit" disabled={submittingShift}>{submittingShift ? "Saving..." : "Log Shift"}</button>
        </form>
      )}


      <div className={styles.columns}>



        {/* Accounts */}
        <div className={styles.card}>
          <h2>Accounts</h2>
          <p>Budget total: £{totalBalance.toFixed(2)}</p>

          {accounts.length === 0 ? <p>No accounts found.</p> : (
            <ul>
              {accounts.map((acc) => {
                const isOpen = openAccountLogs.has(acc.id);
                const accTransfers = getAccountTransfers(acc.id);
                return (
                  <li key={acc.id}>
                    <div className={styles.row} onClick={() => toggleAccountLog(acc.id)}>
                      <span>{acc.account_name} <small>({acc.account_type})</small></span>
                      <span>£{parseFloat(acc.balance).toFixed(2)} {isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div className={styles.subList}>
                        <small>Transfer Log</small>
                        {accTransfers.length === 0 ? <p>No transfers yet.</p> : (
                          <ul>
                            {accTransfers.map((t) => {
                              const isOutgoing = t.from_account_id === acc.id;
                              return (
                                <li key={t.id}>
                                  <div className={styles.row}>
                                    <span>
                                      {isOutgoing ? `→ ${getAccountName(t.to_account_id)}` : `← ${getAccountName(t.from_account_id)}`}
                                      {t.description ? ` · ${t.description}` : ""}
                                    </span>
                                    <span className={isOutgoing ? styles.negative : styles.positive}>
                                      {isOutgoing ? "-" : "+"}£{parseFloat(t.amount).toFixed(2)}
                                    </span>
                                  </div>
                                  {t.date && <small>{t.date}</small>}
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
        </div>


        {/* Envelopes */}
        <div className={styles.card}>
          <h2>Envelopes</h2>
          {envelopes.length === 0 ? <p>No envelopes found.</p> : (
            <ul>
              {envelopes.map((env) => {
                const isOpen = openEnvelopes.has(env.id);
                const envTxs = transactions[env.id] || [];
                return (
                  <li key={env.id}>
                    <div className={styles.row} onClick={() => toggleEnvelopeLog(env.id)}>
                      <span>{env.envelope_name}</span>
                      <span>£{parseFloat(env.balance).toFixed(2)} / £{parseFloat(env.allocated_amount).toFixed(2)} {isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div className={styles.subList}>
                        {envTxs.length === 0 ? <p>No transactions yet.</p> : (
                          <ul>
                            {envTxs.map((tx) => (
                              <li key={tx.id}>
                                <div className={styles.row}>
                                  <span>{tx.description || "—"}</span>
                                  <span className={styles.negative}>-£{parseFloat(tx.amount).toFixed(2)}</span>
                                </div>
                                {tx.date && <small>{tx.date}</small>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>


        {/* Monthly Fixed Costs */}
        <div className={styles.card}>
          <h2>Monthly Costs</h2>
          {fixedCosts.length === 0 ? <p>No fixed costs found.</p> : (
            <ul>
              {fixedCosts.map((cost) => (
                <li key={cost.id} className={styles.row}>
                  <span>{cost.cost_name}</span>
                  <span>£{parseFloat(cost.amount).toFixed(2)}</span>
                  <label>
                    <input type="checkbox" checked={cost.paid} onChange={() => handlePaidToggle(cost)} />
                    Paid?
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Shifts */}
        <div className={styles.card}>
          <h2>Shifts</h2>
          <p>Total this month: £{totalMonthlyPay.toFixed(2)}</p>

          {shifts.length === 0 ? <p>No shifts logged yet.</p> : (
            <ul>
              {shifts.map((shift) => (
                <li key={shift.shift_id}>
                  <div className={styles.row}>
                    <span>{getJobName(shift.job_id)} <small>· {formatShiftType(shift.shift_type)}</small></span>
                    <span>£{parseFloat(shift.total_pay).toFixed(2)}</span>
                  </div>
                  <small>{shift.date} · {shift.hours_worked}hrs · x{shift.rate_multiplier}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

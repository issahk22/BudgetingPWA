"use client";

import { useState, useEffect } from "react";

const API = "http://localhost:8000";


export default function Dashboard() {

  const [bankAccounts, setBankAccounts] = useState([]);
  const [pots, setPots] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [transactions, setTransactions] = useState({});
  const [openEnvelopes, setOpenEnvelopes] = useState(new Set());
  const [openAccountLogs, setOpenAccountLogs] = useState(new Set());

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ envelope_id: "", bank_account_id: "", amount: "", description: "", date: "" });
  const [submitting, setSubmitting] = useState(false);

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferForm, setTransferForm] = useState({ from_account_id: "", to_account_id: "", amount: "", date: "", description: "" });
  const [transferring, setTransferring] = useState(false);

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, potsRes, envelopesRes, fixedCostsRes, transfersRes] = await Promise.all([
          fetch(`${API}/bank-accounts`),
          fetch(`${API}/pots`),
          fetch(`${API}/envelopes`),
          fetch(`${API}/fixed-costs`),
          fetch(`${API}/transfers`),
        ]);

        const accountsData = await accountsRes.json();
        const potsData = await potsRes.json();
        const envelopesData = await envelopesRes.json();
        const fixedCostsData = await fixedCostsRes.json();
        const transfersData = await transfersRes.json();

        setBankAccounts(accountsData);
        setPots(potsData);
        setEnvelopes(envelopesData);
        setFixedCosts(fixedCostsData);
        setTransfers(transfersData);

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


  const totalBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);


  async function handlePaidToggle(cost) {
    const newPaid = !cost.paid;
    const amount = parseFloat(cost.amount);

    await fetch(`${API}/fixed-costs/${cost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });

    if (bankAccounts.length > 0) {
      const account = bankAccounts[0];
      const newBalance = newPaid
        ? parseFloat(account.balance) - amount
        : parseFloat(account.balance) + amount;

      await fetch(`${API}/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });

      setBankAccounts((prev) =>
        prev.map((acc) => acc.id === account.id ? { ...acc, balance: newBalance } : acc)
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
    return bankAccounts.find((a) => a.id === accountId)?.account_name || "Unknown";
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

      const account = bankAccounts.find((a) => a.id === form.bank_account_id);
      if (account) {
        const newBalance = parseFloat(account.balance) - parseFloat(form.amount);
        await fetch(`${API}/bank-accounts/${account.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance }),
        });
        setBankAccounts((prev) =>
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

      setForm({ envelope_id: "", bank_account_id: "", amount: "", description: "", date: "" });
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

      setBankAccounts((prev) =>
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


  if (loading) return <p>Loading...</p>;


  return (
    <div>
      <h1>Dashboard</h1>

      <div>
        <button onClick={() => { setShowForm((v) => !v); setShowTransferForm(false); }}>
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>

        <button onClick={() => { setShowTransferForm((v) => !v); setShowForm(false); }}>
          {showTransferForm ? "Cancel" : "Transfer"}
        </button>
      </div>


      {/* Add Transaction Form */}
      {showForm && (
        <form onSubmit={handleAddTransaction}>
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
            Bank Account
            <select required value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}>
              <option value="">Select account</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.account_name} (£{parseFloat(acc.balance).toFixed(2)})</option>
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

          <button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Transaction"}</button>
        </form>
      )}


      {/* Transfer Form */}
      {showTransferForm && (
        <form onSubmit={handleTransfer}>
          <h3>Transfer Between Accounts</h3>

          <label>
            From Account
            <select required value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}>
              <option value="">Select account</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.account_name} (£{parseFloat(acc.balance).toFixed(2)})</option>
              ))}
            </select>
          </label>

          <label>
            To Account
            <select required value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}>
              <option value="">Select account</option>
              {bankAccounts
                .filter((acc) => acc.id !== transferForm.from_account_id)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.account_name} (£{parseFloat(acc.balance).toFixed(2)})</option>
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

          <button type="submit" disabled={transferring}>{transferring ? "Transferring..." : "Confirm Transfer"}</button>
        </form>
      )}


      <div style={{ display: "flex", gap: "40px", marginTop: "20px", flexWrap: "wrap" }}>

        {/* Bank Accounts */}
        <div>
          <h2>Bank Accounts</h2>
          <p>Total: £{totalBalance.toFixed(2)}</p>

          {bankAccounts.length === 0 ? <p>No accounts found.</p> : (
            <ul>
              {bankAccounts.map((acc) => {
                const isOpen = openAccountLogs.has(acc.id);
                const accTransfers = getAccountTransfers(acc.id);
                return (
                  <li key={acc.id}>
                    <div onClick={() => toggleAccountLog(acc.id)} style={{ cursor: "pointer" }}>
                      <span>{acc.account_name}</span>
                      <span> £{parseFloat(acc.balance).toFixed(2)} {isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div>
                        <small>Transfer Log</small>
                        {accTransfers.length === 0 ? <p>No transfers yet.</p> : (
                          <ul>
                            {accTransfers.map((t) => {
                              const isOutgoing = t.from_account_id === acc.id;
                              return (
                                <li key={t.id}>
                                  <span>
                                    {isOutgoing ? `→ ${getAccountName(t.to_account_id)}` : `← ${getAccountName(t.from_account_id)}`}
                                    {t.description ? ` · ${t.description}` : ""}
                                  </span>
                                  <span> {isOutgoing ? "-" : "+"}£{parseFloat(t.amount).toFixed(2)}</span>
                                  {t.date && <div><small>{t.date}</small></div>}
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


        {/* Pots */}
        <div>
          <h2>Pots</h2>
          {pots.length === 0 ? <p>No pots found.</p> : (
            <ul>
              {pots.map((pot) => (
                <li key={pot.id}>{pot.pot_name} — £{parseFloat(pot.balance).toFixed(2)}</li>
              ))}
            </ul>
          )}
        </div>


        {/* Envelopes */}
        <div>
          <h2>Envelopes</h2>
          {envelopes.length === 0 ? <p>No envelopes found.</p> : (
            <ul>
              {envelopes.map((env) => {
                const isOpen = openEnvelopes.has(env.id);
                const envTxs = transactions[env.id] || [];
                return (
                  <li key={env.id}>
                    <div onClick={() => toggleEnvelopeLog(env.id)} style={{ cursor: "pointer" }}>
                      <span>{env.envelope_name}</span>
                      <span> £{parseFloat(env.balance).toFixed(2)} / £{parseFloat(env.allocated_amount).toFixed(2)} {isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div>
                        {envTxs.length === 0 ? <p>No transactions yet.</p> : (
                          <ul>
                            {envTxs.map((tx) => (
                              <li key={tx.id}>
                                <span>{tx.description || "—"}</span>
                                <span> -£{parseFloat(tx.amount).toFixed(2)}</span>
                                {tx.date && <div><small>{tx.date}</small></div>}
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
        <div>
          <h2>Monthly Costs</h2>
          {fixedCosts.length === 0 ? <p>No fixed costs found.</p> : (
            <ul>
              {fixedCosts.map((cost) => (
                <li key={cost.id}>
                  <span>{cost.cost_name}</span>
                  <span> £{parseFloat(cost.amount).toFixed(2)}</span>
                  <label>
                    <input type="checkbox" checked={cost.paid} onChange={() => handlePaidToggle(cost)} />
                    Paid?
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

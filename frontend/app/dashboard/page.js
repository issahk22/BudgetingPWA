"use client";

import { useState, useEffect } from "react";

const API = "http://localhost:8000";


export default function Dashboard() {

  const [bankAccounts, setBankAccounts] = useState([]);
  const [pots, setPots] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  //map of envelope id to an array of transactions
  const [transactions, setTransactions] = useState({});
  //set of envelope id whose transaction log is expanded
  const [openEnvelopes, setOpenEnvelopes] = useState(new Set());

  //add transaction form use state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ envelope_id: "", bank_account_id: "", amount: "", description: "", date: "" });
  const [submitting, setSubmitting] = useState(false);

  // Loading added in case of API delays so user does not see incorrect info
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    async function fetchData() {
      try {
        //runs all requests simultaneously
        const [accountsRes, potsRes, envelopesRes, fixedCostsRes] = await Promise.all([
          fetch(`${API}/bank-accounts`),
          fetch(`${API}/pots`),
          fetch(`${API}/envelopes`),
          fetch(`${API}/fixed-costs`),
        ]);

        const accountsData = await accountsRes.json();
        const potsData = await potsRes.json();
        const envelopesData = await envelopesRes.json();
        const fixedCostsData = await fixedCostsRes.json();

        setBankAccounts(accountsData);
        setPots(potsData);
        setEnvelopes(envelopesData);
        setFixedCosts(fixedCostsData);


        
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


  const totalBalance = bankAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0
  );


  async function handlePaidToggle(cost) {
    const newPaid = !cost.paid;
    const amount = parseFloat(cost.amount);

    //update fixed cost "paid?" status
    await fetch(`${API}/fixed-costs/${cost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });

    //adjust the first bank account balance accordingly. WILL NEED TO BE CHANGED LATER.
    if (bankAccounts.length > 0) {
      const account = bankAccounts[0];
      const currentBalance = parseFloat(account.balance);
      //maths logic. if user marks as paid, amount will be deducted from bank account
      const newBalance = newPaid
        ? currentBalance - amount
        : currentBalance + amount;

      await fetch(`${API}/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });

      setBankAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id ? { ...acc, balance: newBalance } : acc
        )
      );
    }

    setFixedCosts((prev) =>
      prev.map((c) => (c.id === cost.id ? { ...c, paid: newPaid } : c))
    );
  }



  function toggleEnvelopeLog(envId) {
    setOpenEnvelopes((prev) => {
      const next = new Set(prev);
      next.has(envId) ? next.delete(envId) : next.add(envId);
      return next;
    });
  }



  async function handleAddTransaction(e) {
    e.preventDefault();
    setSubmitting(true);

    try {

      //backend deducts from envelope balance automatically

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

      //deduct amount from selected bank account

      const account = bankAccounts.find((a) => a.id === form.bank_account_id);
      if (account) {
        const newBalance = parseFloat(account.balance) - parseFloat(form.amount);
        await fetch(`${API}/bank-accounts/${account.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance }),
        });
        setBankAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, balance: newBalance } : a))
        );
      }


      //update envelope balance in local state

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

      //auto expand envelope log
      setOpenEnvelopes((prev) => new Set(prev).add(form.envelope_id));

      setForm({ envelope_id: "", bank_account_id: "", amount: "", description: "", date: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add transaction:", err);
    } finally {
      setSubmitting(false);
    }
  }


  if (loading) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }


  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      {/* Add Transaction Button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        style={{ marginTop: "16px", marginBottom: "8px", padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
      >
        {showForm ? "Cancel" : "+ Add Transaction"}
      </button>



      {/* Add Transaction UI */}
      {showForm && (
        <form
          onSubmit={handleAddTransaction}
          style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px", maxWidth: "420px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <h3 style={{ margin: 0 }}>New Transaction</h3>

          <label style={{ fontSize: "13px" }}>
            Envelope
            <select
              required
              value={form.envelope_id}
              onChange={(e) => setForm({ ...form, envelope_id: e.target.value })}
              style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">Select envelope</option>
              {envelopes.map((env) => (
                <option key={env.id} value={env.id}>{env.envelope_name}</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "13px" }}>
            Bank Account
            <select
              required
              value={form.bank_account_id}
              onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
              style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">Select account</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.account_name} (£{parseFloat(acc.balance).toFixed(2)})</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: "13px" }}>
            Amount (£)
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ fontSize: "13px" }}>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ fontSize: "13px" }}>
            Description (optional)
            <input
              type="text"
              maxLength={80}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "8px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
          >
            {submitting ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      )}





      <div style={{ display: "flex", gap: "40px", marginTop: "20px", flexWrap: "wrap" }}>

        {/* Bank Accounts */}
        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Bank Accounts</h2>
          <p>Total: £{totalBalance.toFixed(2)}</p>

          {bankAccounts.length === 0 ? (
            <p>No accounts found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {bankAccounts.map((acc, i) => (
                <li key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>{acc.account_name}</span>
                  <span>£{parseFloat(acc.balance).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>


        {/* Pots */}
        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Pots</h2>

          {pots.length === 0 ? (
            <p>No pots found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {pots.map((pot) => (
                <li key={pot.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>{pot.pot_name}</span>
                  <span>£{parseFloat(pot.balance).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>


        {/* Envelopes */}
        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "240px" }}>

          <h2>Envelopes</h2>

          {envelopes.length === 0 ? (
            <p>No envelopes found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {envelopes.map((env) => {
                const isOpen = openEnvelopes.has(env.id);
                const envTxs = transactions[env.id] || [];
                return (
                  <li key={env.id} style={{ marginBottom: "10px" }}>
                    <div
                      onClick={() => toggleEnvelopeLog(env.id)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
                    >
                      <span>{env.envelope_name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>£{parseFloat(env.balance).toFixed(2)} / £{parseFloat(env.allocated_amount).toFixed(2)}</span>
                        <span style={{ fontSize: "11px", color: "#888" }}>{isOpen ? "▲" : "▼"}</span>
                      </span>
                    </div>

                    {/* Transaction log dropdown */}
                    {isOpen && (
                      <div style={{ marginTop: "6px", paddingLeft: "8px", borderLeft: "2px solid #e5e7eb" }}>
                        {envTxs.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "#888", margin: "4px 0" }}>No transactions yet.</p>
                        ) : (
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {envTxs.map((tx) => (
                              <li key={tx.id} style={{ fontSize: "12px", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "#374151" }}>{tx.description || "—"}</span>
                                  <span style={{ color: "#dc2626", fontWeight: 500 }}>-£{parseFloat(tx.amount).toFixed(2)}</span>
                                </div>
                                {tx.date && <div style={{ color: "#9ca3af" }}>{tx.date}</div>}
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
        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Monthly Costs</h2>

          {fixedCosts.length === 0 ? (
            <p>No fixed costs found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {fixedCosts.map((cost) => (
                <li key={cost.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "16px" }}>
                  <span>{cost.cost_name}</span>
                  <span>£{parseFloat(cost.amount).toFixed(2)}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={cost.paid}
                      onChange={() => handlePaidToggle(cost)}
                    />
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

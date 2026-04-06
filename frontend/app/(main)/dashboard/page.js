"use client";

import { useState, useEffect } from "react";
import TransactionForm from "./components/TransactionForm";
import TransferForm from "./components/TransferForm";
import ShiftForm from "./components/ShiftForm";
import EndMonthModal from "./components/EndMonthModal";
import AllocationsModal from "./components/AllocationsModal";
import EnvelopeCard from "./components/EnvelopeCard";
import AddEnvelopeModal from "./components/AddEnvelopeModal";
import AccountsSummary from "./components/AccountsSummary";
import PotsSummary from "./components/PotsSummary";
import MonthlyCosts from "./components/MonthlyCosts";
import ManageCostsModal from "./components/ManageCostsModal";
import ManagePotsModal from "./components/ManagePotsModal";
import ShiftsCard from "./components/ShiftsCard";
import UnexpectedExpenseModal from "./components/UnexpectedExpenseModal";

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
  const [savingsInputs, setSavingsInputs] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [savingAllocations, setSavingAllocations] = useState(false);
  const [lastMonthSpend, setLastMonthSpend] = useState({});

  //manage monthly costs modal visibility
  const [showManageCosts, setShowManageCosts] = useState(false);

  //manage pots modal visibility
  const [showManagePots, setShowManagePots] = useState(false);

  //unexpected expenditure modal
  const [showUnexpected, setShowUnexpected] = useState(false);

  //envelope crud: add, edit, delete
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvAmount, setNewEnvAmount] = useState("");
  const [editingEnvelope, setEditingEnvelope] = useState(null);
  const [editEnvName, setEditEnvName] = useState("");
  const [editEnvAmount, setEditEnvAmount] = useState("");

  // tracks which month the dashboard is currently viewing — derived from history on load
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [loading, setLoading] = useState(true);


  async function loadAllData() {
    const [accountsRes, envelopesRes, fixedCostsRes, transfersRes, jobsRes, shiftsRes, shiftTypesRes, histMonthsRes] = await Promise.all([
      fetch(`${API}/accounts`),
      fetch(`${API}/envelopes`),
      fetch(`${API}/fixed-costs`),
      fetch(`${API}/transfers`),
      fetch(`${API}/jobs`),
      fetch(`${API}/shifts`),
      fetch(`${API}/shift-types`),
      fetch(`${API}/history/months`),
    ]);

    const accountsData = await accountsRes.json();
    const envelopesData = await envelopesRes.json();
    const fixedCostsData = await fixedCostsRes.json();
    const transfersData = await transfersRes.json();
    const jobsData = await jobsRes.json();
    const shiftsData = await shiftsRes.json();
    const shiftTypesData = await shiftTypesRes.json();
    const histMonths = await histMonthsRes.json();

    setAccounts(accountsData);
    setEnvelopes(envelopesData);
    setFixedCosts(fixedCostsData);
    setTransfers(transfersData);
    setJobs(jobsData);
    setShifts(shiftsData);
    setShiftTypes(shiftTypesData);

    // set dashboard month to the month after the latest closed month (falls back to real current month)
    if (histMonths.length > 0) {
      const latest = histMonths[0];
      // latest.month is 1-based; JS Date month is 0-based, so passing latest.month directly = next month
      setViewDate(new Date(latest.year, latest.month, 1));
    }

    if (envelopesData.length > 0) {
      const txResults = await Promise.all(
        envelopesData.map((env) =>
          fetch(`${API}/transactions/envelope/${env.id}`).then((r) => r.json())
        )
      );
      const txMap = {};
      envelopesData.forEach((env, i) => { txMap[env.id] = txResults[i]; });
      setTransactions(txMap);
    } else {
      setTransactions({});
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        await loadAllData();
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);



  const viewMonthLabel = viewDate.toLocaleString("default", { month: "long", year: "numeric" });


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




  async function handleAddCost(name, amount) {
    try {
      const res = await fetch(`${API}/fixed-costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cost_name: name, amount, paid: false }),
      });
      const created = await res.json();
      setFixedCosts((prev) => [...prev, created]);
    } catch (err) {
      console.error("Failed to add fixed cost:", err);
    }
  }

  async function handleEditCost(cost, newName, newAmount) {
    try {
      const res = await fetch(`${API}/fixed-costs/${cost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cost_name: newName, amount: newAmount }),
      });
      const updated = await res.json();
      setFixedCosts((prev) => prev.map((c) => c.id === cost.id ? updated : c));

      //if cost was  paid, adjust  bank account balance by the difference
      if (cost.paid) {
        const diff = parseFloat(cost.amount) - newAmount;
        const bankAccount = accounts.find((a) => a.include_in_budget);
        if (bankAccount && diff !== 0) {
          const newBalance = parseFloat(bankAccount.balance) + diff;
          await fetch(`${API}/accounts/${bankAccount.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance: newBalance }),
          });
          setAccounts((prev) =>
            prev.map((acc) => acc.id === bankAccount.id ? { ...acc, balance: newBalance } : acc)
          );
        }
      }
    } catch (err) {
      console.error("Failed to update fixed cost:", err);
    }
  }

  async function handleDeleteCost(cost) {
    try {
      await fetch(`${API}/fixed-costs/${cost.id}`, { method: "DELETE" });
      setFixedCosts((prev) => prev.filter((c) => c.id !== cost.id));

      //if cost was paid, restore  amount to the bank account
      if (cost.paid) {
        const bankAccount = accounts.find((a) => a.include_in_budget);
        if (bankAccount) {
          const newBalance = parseFloat(bankAccount.balance) + parseFloat(cost.amount);
          await fetch(`${API}/accounts/${bankAccount.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance: newBalance }),
          });
          setAccounts((prev) =>
            prev.map((acc) => acc.id === bankAccount.id ? { ...acc, balance: newBalance } : acc)
          );
        }
      }
    } catch (err) {
      console.error("Failed to delete fixed cost:", err);
    }
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
          account_id: form.account_id || null,
          amount: parseFloat(form.amount),
          description: form.description || null,
          date: form.date || null,
        }),
      });
      const newTx = await txRes.json();

      // update local state to reflect backend changes
      if (form.account_id) {
        setAccounts((prev) =>
          prev.map((a) => a.id === form.account_id
            ? { ...a, balance: parseFloat(a.balance) - parseFloat(form.amount) }
            : a)
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
          rate_multiplier: shiftForm.rate_multiplier ? parseFloat(shiftForm.rate_multiplier) : null,
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
      const closeMonth = viewDate.getMonth() + 1; // 1-based from viewDate
      const closeYear = viewDate.getFullYear();
      const res = await fetch(`${API}/month-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: closeMonth,
          year: closeYear,
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

      // advance dashboard month label to the new month
      setViewDate(new Date(closeYear, closeMonth, 1));

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

      //initialise savings inputs for pot accounts (empty = £0, user decides fresh each month)
      const savingsInit = {};
      freshAccounts.filter((a) => a.account_type === "pot").forEach((pot) => { savingsInit[pot.id] = ""; });
      setSavingsInputs(savingsInit);

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

      // fetch last month's envelope spend for display in allocations modal
      try {
        const monthsRes = await fetch(`${API}/history/months`);
        const months = await monthsRes.json();
        if (months.length > 0) {
          const latest = months[0];
          const envHistRes = await fetch(`${API}/history/envelopes/${latest.year}/${latest.month}`);
          const envHist = await envHistRes.json();
          const spendMap = {};
          envHist.forEach((e) => { spendMap[e.envelope_name] = parseFloat(e.actual_spent); });
          setLastMonthSpend(spendMap);
        }
      } catch {
        setLastMonthSpend({});
      }

      setShowAllocations(true);
    } catch (err) {
      console.error("Failed to close month:", err);
    } finally {
      setClosingMonth(false);
    }
  }


  //saves each envelope's new allocated amount for the new month, blank fields save as 0
  //also transfers savings to pot accounts and updates goal progress
  async function handleSaveAllocations(e) {
    e.preventDefault();
    setSavingAllocations(true);

    try {
      //update envelope allocations
      await Promise.all(
        envelopes.map((env) =>
          fetch(`${API}/envelopes/${env.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allocated_amount: parseFloat(allocations[env.id]) || 0 }),
          })
        )
      );

      //transfer savings to pot accounts (pot balance is the savings progress)
      const primaryAccount = accounts.find((a) => a.include_in_budget);

      if (primaryAccount) {
        const savingsTransfers = Object.entries(savingsInputs)
          .filter(([, val]) => parseFloat(val) > 0)
          .map(([potId, val]) => {
            const amount = parseFloat(val);
            return fetch(`${API}/transfers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                from_account_id: primaryAccount.id,
                to_account_id: potId,
                amount,
                description: "Monthly savings allocation",
              }),
            });
          });

        if (savingsTransfers.length > 0) {
          await Promise.all(savingsTransfers);
        }
      }

      setShowAllocations(false);
      await loadAllData();
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)); //moves month forward 
    } catch (err) {
      console.error("Failed to save allocations:", err);
    } finally {
      setSavingAllocations(false);
    }
  }


  //adds a new envelope
  async function handleAddEnvelope(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/envelopes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envelope_name: newEnvName, allocated_amount: parseFloat(newEnvAmount) }),
      });
      const created = await res.json();
      setEnvelopes((prev) => [...prev, created]);
      setTransactions((prev) => ({ ...prev, [created.id]: [] }));
      setNewEnvName("");
      setNewEnvAmount("");
      setShowAddEnvelope(false);
    } catch (err) {
      console.error("Failed to add envelope:", err);
    }
  }

  //updates an existing envelope's name and/or allocated amount
  async function handleEditEnvelope(envId) {
    try {
      const res = await fetch(`${API}/envelopes/${envId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envelope_name: editEnvName, allocated_amount: parseFloat(editEnvAmount) }),
      });
      const updated = await res.json();
      setEnvelopes((prev) => prev.map((env) => env.id === envId ? updated : env));
      setEditingEnvelope(null);
    } catch (err) {
      console.error("Failed to update envelope:", err);
    }
  }

  //deletes an envelope (only if it has no transactions)
  async function handleDeleteEnvelope(envId) {
    try {
      const res = await fetch(`${API}/envelopes/${envId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        console.error("Delete failed:", err.detail);
        return;
      }
      setEnvelopes((prev) => prev.filter((env) => env.id !== envId));
      setTransactions((prev) => { const next = { ...prev }; delete next[envId]; return next; });
    } catch (err) {
      console.error("Failed to delete envelope:", err);
    }
  }


  //updates a pot's target amount and deadline (monthly_contribution auto-recalcs on backend)
  async function handleEditPotGoal(pot, newTarget, newDeadline) {
    try {
      const res = await fetch(`${API}/accounts/${pot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_amount: newTarget,
          deadline: newDeadline || null,
        }),
      });
      const updated = await res.json();
      setAccounts((prev) => prev.map((a) => a.id === pot.id ? updated : a));
    } catch (err) {
      console.error("Failed to update pot goal:", err);
    }
  }


  async function handleDeleteTransaction(tx) {
    try {
      await fetch(`${API}/transactions/${tx.id}`, { method: "DELETE" });
      
      //removed deleted transaction from screen
      setTransactions((prev) => ({
        ...prev,
        [tx.envelope_id]: (prev[tx.envelope_id] || []).filter((t) => t.id !== tx.id),
      }));

      //adds transaction amnt back to envelope once deleted
      setEnvelopes((prev) =>
        prev.map((env) =>
          env.id === tx.envelope_id
            ? { ...env, balance: parseFloat(env.balance) + parseFloat(tx.amount) }
            : env
        )
      );

      //adds transaction amnt back to account balance 
      if (tx.account_id) {
        setAccounts((prev) =>
          prev.map((a) => a.id === tx.account_id
            ? { ...a, balance: parseFloat(a.balance) + parseFloat(tx.amount) }
            : a)
        );
      }
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    }
  }


  async function handleUnexpectedExpense(transactions, unbudgetedAmount) {
    try {
      // create a transaction for each envelope allocation
      for (const tx of transactions) {
        const txRes = await fetch(`${API}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx),
        });
        const newTx = await txRes.json();

        setEnvelopes((prev) =>
          prev.map((env) => env.id === tx.envelope_id
            ? { ...env, balance: parseFloat(env.balance) - tx.amount } : env)
        );
        if (tx.account_id) {
          setAccounts((prev) =>
            prev.map((a) => a.id === tx.account_id
              ? { ...a, balance: parseFloat(a.balance) - tx.amount } : a)
          );
        }
        setTransactions((prev) => ({
          ...prev,
          [tx.envelope_id]: [newTx, ...(prev[tx.envelope_id] || [])],
        }));
      }

      // deduct unbudgeted portion directly from bank account
      if (unbudgetedAmount > 0) {
        const bank = accounts.find((a) => a.include_in_budget);
        if (bank) {
          const newBalance = parseFloat(bank.balance) - unbudgetedAmount;
          await fetch(`${API}/accounts/${bank.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balance: newBalance }),
          });
          setAccounts((prev) =>
            prev.map((a) => a.id === bank.id ? { ...a, balance: newBalance } : a)
          );
        }
      }
    } catch (err) {
      console.error("Failed to handle unexpected expense:", err);
    }
  }


  if (loading) return <p className="text-muted text-lg">Loading...</p>;


  return (
    <div>


        {/* Add Transaction Form */}
        {showForm && (
          <TransactionForm
            form={form} setForm={setForm}
            envelopes={envelopes} accounts={accounts}
            submitting={submitting}
            onSubmit={handleAddTransaction}
            onClose={() => setShowForm(false)}
          />
        )}


        {/* Transfer Form */}
        {showTransferForm && (
          <TransferForm
            transferForm={transferForm} setTransferForm={setTransferForm}
            accounts={accounts} transferring={transferring}
            onSubmit={handleTransfer}
            onClose={() => setShowTransferForm(false)}
          />
        )}


        {/* Add Shift  */}
        {showShiftForm && (
          <ShiftForm
            shiftForm={shiftForm} setShiftForm={setShiftForm}
            jobs={jobs} shiftTypes={shiftTypes}
            submittingShift={submittingShift}
            onSubmit={handleLogShift}
            onClose={() => setShowShiftForm(false)}
          />
        )}


        {/* End Month */}
        {showEndMonth && (
          <EndMonthModal
            netIncome={netIncome} setNetIncome={setNetIncome}
            closingMonth={closingMonth}
            onSubmit={handleEndMonth}
            onClose={() => setShowEndMonth(false)}
          />
        )}



        {/* Manage Monthly Costs */}
        {showManageCosts && (
          <ManageCostsModal
            fixedCosts={fixedCosts}
            onAdd={handleAddCost}
            onEdit={handleEditCost}
            onDelete={handleDeleteCost}
            onClose={() => setShowManageCosts(false)}
          />
        )}


        {/* Unexpected Expenditure */}
        {showUnexpected && (
          <UnexpectedExpenseModal
            envelopes={envelopes}
            accounts={accounts}
            onSubmit={handleUnexpectedExpense}
            onClose={() => setShowUnexpected(false)}
          />
        )}

        {/* Manage Pots (edit goal target + deadline) */}
        {showManagePots && (
          <ManagePotsModal
            accounts={accounts}
            onEdit={handleEditPotGoal}
            onClose={() => setShowManagePots(false)}
          />
        )}


        {/* Add Envelope */}
        {showAddEnvelope && (
          <AddEnvelopeModal
            newEnvName={newEnvName} setNewEnvName={setNewEnvName}
            newEnvAmount={newEnvAmount} setNewEnvAmount={setNewEnvAmount}
            onSubmit={handleAddEnvelope}
            onClose={() => { setShowAddEnvelope(false); setNewEnvName(""); setNewEnvAmount(""); }}
            leftToBudget={(() => {
              const accBal = accounts.filter(a => a.include_in_budget).reduce((s, a) => s + parseFloat(a.balance), 0);
              const unpaid = fixedCosts.filter(c => !c.paid).reduce((s, c) => s + parseFloat(c.amount), 0);
              const allocated = envelopes.reduce((s, e) => s + parseFloat(e.balance), 0);
              return Math.round((accBal - unpaid - allocated) * 100) / 100;
            })()}
          />
        )}


        {/* Envelope allocations post end month */}
        {showAllocations && (
          <AllocationsModal
            accounts={accounts} envelopes={envelopes} fixedCosts={fixedCosts}
            allocations={allocations} setAllocations={setAllocations}
            savingsInputs={savingsInputs} setSavingsInputs={setSavingsInputs}
            recommendations={recommendations}
            lastMonthSpend={lastMonthSpend}
            savingAllocations={savingAllocations}
            onSubmit={handleSaveAllocations}
          />
        )}




        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[40px] font-bold text-text mb-1 inline-block border-b-4 border-accent pb-1">Dashboard</h1>

          <div className="flex items-center gap-2 mt-6 mb-5">
            <span className="text-[28px] font-bold text-[#00BBA8] font-[var(--font-inter)]">{viewMonthLabel}</span>
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
              className="px-4 py-2 rounded-lg font-medium text-sm border border-yellow-600 text-yellow-500 bg-black hover:bg-yellow-950 transition-colors"
              onClick={() => setShowUnexpected(true)}
            >
              Unexpected Expenditure
            </button>

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
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[28px] font-bold text-text font-[var(--font-inter)]">Envelopes</h2>
              <button
                onClick={() => setShowAddEnvelope((v) => !v)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
              >
                + Add Envelope
              </button>
            </div>

            {/* Amount left to budget */}
            {(() => {
              const primaryAcc = accounts.find((a) => a.include_in_budget);
              const accBal = primaryAcc ? parseFloat(primaryAcc.balance) : 0;
              const unpaidFixedTotal = fixedCosts
                .filter((c) => !c.paid) //filters unpaid costs 
                .reduce((sum, c) => sum + parseFloat(c.amount), 0); //adds up all unpaid costs 

              //amount left to budget = Account balance - (remaining balances in envelope + unpaid fixed costs total)
              const totalEnvelopeBalance = envelopes.reduce((sum, e) => sum + parseFloat(e.balance), 0);
              const leftToBudget = Math.round((accBal - unpaidFixedTotal - totalEnvelopeBalance) * 100) / 100;
              return (
                <div className="bg-gray-800 rounded-lg px-4 py-2 mb-4 flex justify-between items-center text-sm">
                  <span className="text-muted">Amount left to budget</span>
                  <span className={leftToBudget < 0 ? "text-negative font-medium" : "text-accent font-medium"}>
                    £{leftToBudget.toFixed(2)}
                  </span>
                </div>
              );
            })()}

            <div className="h-[1.5px] w-full bg-[#262626] mb-4"></div>

            {envelopes.length === 0 ? (
              <p className="text-sm text-muted mb-6">No envelopes found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {envelopes.map((env) => (
                  <EnvelopeCard
                    key={env.id}
                    env={env}
                    isOpen={openEnvelopes.has(env.id)}
                    envTxs={transactions[env.id] || []}
                    editingEnvelope={editingEnvelope}
                    editEnvName={editEnvName} setEditEnvName={setEditEnvName}
                    editEnvAmount={editEnvAmount} setEditEnvAmount={setEditEnvAmount}
                    onToggle={() => toggleEnvelopeLog(env.id)}
                    onStartEdit={() => { setEditingEnvelope(env.id); setEditEnvName(env.envelope_name); setEditEnvAmount(parseFloat(env.allocated_amount).toFixed(2)); }}
                    onSaveEdit={handleEditEnvelope}
                    onCancelEdit={() => setEditingEnvelope(null)}
                    accounts={accounts}
                    onDelete={handleDeleteEnvelope}
                    onDeleteTx={handleDeleteTransaction}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">

            {/* Accounts Summary (bank) */}
            <AccountsSummary
              accounts={accounts}
              openAccountLogs={openAccountLogs}
              onToggle={toggleAccountLog}
              getAccountTransfers={getAccountTransfers}
              getAccountName={getAccountName}
            />

            {/* Pots Summary */}
            <PotsSummary
              accounts={accounts}
              openAccountLogs={openAccountLogs}
              onToggle={toggleAccountLog}
              getAccountTransfers={getAccountTransfers}
              getAccountName={getAccountName}
              onManage={() => setShowManagePots(true)}
            />

            {/* Monthly Costs + Shifts */}
            <div className="grid grid-cols-2 gap-4 items-start">

              <MonthlyCosts fixedCosts={fixedCosts} onPaidToggle={handlePaidToggle} onManage={() => setShowManageCosts(true)} />

              <ShiftsCard
                shifts={shifts}
                totalMonthlyPay={totalMonthlyPay}
                getJobName={getJobName}
                formatShiftType={formatShiftType}
              />

            </div>

          </div>

        </div>

    </div>
  );
}

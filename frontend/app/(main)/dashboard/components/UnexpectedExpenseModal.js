"use client";

import { useState } from "react";

export default function UnexpectedExpenseModal({ envelopes, accounts, onSubmit, onClose }) {
  const [amount, setAmount] = useState("");
  const [envAmounts, setEnvAmounts] = useState({});
  const [unbudgetedAmount, setUnbudgetedAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const expenseAmount = parseFloat(amount) || 0;

  //how much is left to budget (unallocated money sitting in the bank account)
  const bankAccount = accounts.find((a) => a.include_in_budget);
  const bankBalance = bankAccount ? parseFloat(bankAccount.balance) : 0;
  const leftToBudget = Math.round(bankBalance * 100) / 100;

  const totalFromEnvelopes = Object.values(envAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalFromUnbudgeted = parseFloat(unbudgetedAmount) || 0;
  const totalCovered = Math.round((totalFromEnvelopes + totalFromUnbudgeted) * 100) / 100;
  const remaining = Math.round((expenseAmount - totalCovered) * 100) / 100;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const transactions = [];

      // one transaction per envelope that has an amount
      for (const env of envelopes) {
        const val = parseFloat(envAmounts[env.id]) || 0;
        if (val > 0) {
          transactions.push({
            envelope_id: env.id,
            account_id: bankAccount?.id || null,
            amount: val,
            description: "Unexpected expenditure",
          });
        }
      }

      // if taking from unbudgeted, deduct directly from bank (no envelope)
      const unbudgeted = parseFloat(unbudgetedAmount) || 0;

      await onSubmit(transactions, unbudgeted);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
      <form className="bg-card border border-border rounded-xl p-6 w-full max-w-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className="text-text font-bold text-lg">Unexpected Expenditure</h3>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Amount (£)
          <input type="number" required min="0.01" max={bankBalance > 0 ? bankBalance : 0} step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <span className="text-xs text-muted">Max: £{Math.max(0, bankBalance).toFixed(2)}</span>
        </label>

        {expenseAmount > 0 && (
          <>
            <p className="text-xs text-muted">Choose where to take the money from:</p>

            <div className="flex text-xs text-muted font-medium border-b border-gray-700 pb-1">
              <span className="flex-1">Envelope</span>
              <span className="w-24 text-center">Remaining</span>
              <span className="w-24 text-center">Take (£)</span>
            </div>

            {envelopes.map((env) => {
              const bal = parseFloat(env.balance);
              return (
                <div key={env.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-text">{env.envelope_name}</span>
                  <span className={`w-24 text-center text-xs ${bal <= 0 ? "text-negative" : "text-muted"}`}>
                    £{bal.toFixed(2)}
                  </span>
                  <input type="number" min="0" max={Math.max(0, bal)} step="0.01"
                    value={envAmounts[env.id] ?? ""}
                    onChange={(e) => setEnvAmounts((prev) => ({ ...prev, [env.id]: e.target.value }))}
                    className="w-24 px-2 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent"
                    disabled={bal <= 0} />
                </div>
              );
            })}

            {/* Unbudgeted money */}
            <div className="flex items-center gap-2 border-t border-gray-700 pt-2">
              <span className="flex-1 text-sm text-text">Amount left to budget</span>
              <span className={`w-24 text-center text-xs ${leftToBudget <= 0 ? "text-negative" : "text-muted"}`}>
                £{leftToBudget.toFixed(2)}
              </span>
              <input type="number" min="0" max={Math.max(0, leftToBudget)} step="0.01"
                value={unbudgetedAmount}
                onChange={(e) => setUnbudgetedAmount(e.target.value)}
                className="w-24 px-2 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={leftToBudget <= 0} />
            </div>

            {/* Summary */}
            <div className="bg-gray-800 rounded-lg px-4 py-2 flex justify-between text-sm">
              <span className="text-muted">Covered</span>
              <span className={remaining > 0.01 ? "text-negative font-medium" : "text-accent font-medium"}>
                £{totalCovered.toFixed(2)} / £{expenseAmount.toFixed(2)}
              </span>
            </div>

            {remaining > 0.01 && (
              <p className="text-xs text-negative">£{remaining.toFixed(2)} still uncovered.</p>
            )}
          </>
        )}

        <div className="flex gap-2 mt-1">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting || expenseAmount <= 0 || remaining > 0.01 || totalCovered === 0}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Saving..." : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}

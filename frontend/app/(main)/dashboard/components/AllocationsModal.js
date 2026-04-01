"use client";

export default function AllocationsModal({
  accounts, envelopes, fixedCosts, allocations, setAllocations,
  savingsInputs, setSavingsInputs, recommendations, lastMonthSpend,
  savingAllocations, onSubmit,
}) {
  const primaryAccount = accounts.find((a) => a.include_in_budget);
  const accountBalance = primaryAccount ? parseFloat(primaryAccount.balance) : 0;
  const fixedTotal = fixedCosts.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const availableBudget = accountBalance - fixedTotal;
  const allocatedSum = Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const savingsSum = Object.values(savingsInputs).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const remaining = availableBudget - allocatedSum - savingsSum;
  const isNegativeAvailable = availableBudget < 0;
  const potAccounts = accounts.filter((a) => a.account_type === "pot");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
    <form className="bg-card border border-border rounded-xl p-5 w-full max-w-lg flex flex-col gap-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
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
              <div className="flex-1">
                <span className="text-sm text-text">{env.envelope_name}</span>
                {lastMonthSpend?.[env.envelope_name] !== undefined && (
                  <p className="text-xs text-muted">Last month: £{lastMonthSpend[env.envelope_name].toFixed(2)}</p>
                )}
              </div>
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

          {/* Savings pots section */}
          {potAccounts.length > 0 && (
            <>
              <div className="flex text-xs text-muted font-medium border-b border-gray-700 pb-1 mb-1 mt-3">
                <span className="flex-1">Savings</span>
                <span className="w-28 text-right">Amount (£)</span>
              </div>

              {potAccounts.map((pot) => (
                <div key={pot.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-text">{pot.account_name}</span>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={savingsInputs[pot.id] ?? ""}
                    onChange={(e) => setSavingsInputs((prev) => ({ ...prev, [pot.id]: e.target.value }))}
                    className="w-28 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              ))}
            </>
          )}

          <button type="submit" disabled={savingAllocations || remaining < 0}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {savingAllocations ? "Saving..." : "Save Allocations"}
          </button>
        </>
      )}
    </form>
    </div>
  );
}

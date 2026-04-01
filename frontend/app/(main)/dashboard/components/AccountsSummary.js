"use client";

import Card from "../../../components/Card";

export default function AccountsSummary({ accounts, totalBalance, openAccountLogs, onToggle, getAccountTransfers, getAccountName }) {
  return (
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
                  onClick={() => onToggle(acc.id)}
                >
                  <span className="text-sm text-text">
                    {acc.account_name} <span className="text-xs text-muted">({acc.account_type})</span>
                    {acc.account_type === "pot" && acc.target_amount && (
                      <span className="block text-xs text-muted mt-0.5">
                        Goal: £{parseFloat(acc.balance).toFixed(2)} / £{parseFloat(acc.target_amount).toFixed(2)}
                        {acc.monthly_contribution && (
                          <span className="ml-2 text-accent">· £{parseFloat(acc.monthly_contribution).toFixed(2)}/mo</span>
                        )}
                        {acc.deadline && (
                          <span className="ml-1">· by {acc.deadline}</span>
                        )}
                      </span>
                    )}
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
  );
}

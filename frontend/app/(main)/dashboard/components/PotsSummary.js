"use client";

import Card from "../../../components/Card";

export default function PotsSummary({ accounts, openAccountLogs, onToggle, getAccountTransfers, getAccountName, onManage }) {
  const pots = accounts.filter((acc) => acc.account_type === "pot");
  const totalPotBalance = pots.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const hasGoals = pots.some((p) => p.target_amount);

  return (
    <Card className="w-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-text">Pots</h2>
        {hasGoals && (
          <button onClick={onManage} className="text-xs text-muted hover:text-accent transition-colors">Edit</button>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-3">£{totalPotBalance.toFixed(2)}</p>

      {pots.length === 0 ? <p className="text-sm text-muted">No pots found.</p> : (
        <ul className="space-y-0">
          {pots.map((acc) => {
            const isOpen = openAccountLogs.has(acc.id);
            const accTransfers = getAccountTransfers(acc.id);
            const target = acc.target_amount ? parseFloat(acc.target_amount) : null;
            const progressPct = target && target > 0 ? Math.min(100, (parseFloat(acc.balance) / target) * 100) : null;
            return (
              <li key={acc.id}>
                <div
                  className="flex justify-between items-center py-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors"
                  onClick={() => onToggle(acc.id)}
                >
                  <span className="text-sm text-text flex-1 min-w-0 pr-2">
                    {acc.account_name}
                    {target && (
                      <span className="block text-xs text-muted mt-0.5">
                        Goal: £{parseFloat(acc.balance).toFixed(2)} / £{target.toFixed(2)}
                        {acc.monthly_contribution && (
                          <span className="ml-2 text-accent">· £{parseFloat(acc.monthly_contribution).toFixed(2)}/mo</span>
                        )}
                        {acc.deadline && (
                          <span className="ml-1">· by {acc.deadline}</span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-text font-medium whitespace-nowrap">
                    £{parseFloat(acc.balance).toFixed(2)} <span className="text-xs text-muted">{isOpen ? "▲" : "▼"}</span>
                  </span>
                </div>

                {/* progress bar for pots with a goal */}
                {progressPct !== null && (
                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mt-1 mb-1">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}

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

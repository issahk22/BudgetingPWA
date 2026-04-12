"use client";

import Card from "../../../components/Card";

export default function PotsSummary({ accounts, openAccountLogs, onToggle, getAccountTransfers, getAccountName, onManage }) {
  const pots = accounts.filter((acc) => acc.account_type === "pot");
  const totalPotBalance = pots.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const hasGoals = pots.some((p) => p.target_amount);

  const RING_SIZE = 68;
  const STROKE = 6;
  const RADIUS = (RING_SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <Card className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-text">Pots</h2>
        {hasGoals && (
          <button onClick={onManage} className="text-xs text-muted hover:text-accent transition-colors">Edit</button>
        )}
      </div>

      {pots.length === 0 ? <p className="text-sm text-muted">No pots found.</p> : (
        <ul className="space-y-0">
          {pots.map((acc) => {
            const isOpen = openAccountLogs.has(acc.id);
            const accTransfers = getAccountTransfers(acc.id);
            const target = acc.target_amount ? parseFloat(acc.target_amount) : null;
            const progressPct = target && target > 0 ? Math.min(100, (parseFloat(acc.balance) / target) * 100) : null;
            const dashOffset = progressPct !== null ? CIRCUMFERENCE * (1 - progressPct / 100) : CIRCUMFERENCE;
            return (
              <li key={acc.id}>
                <div
                  className="flex items-center gap-3 py-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors"
                  onClick={() => onToggle(acc.id)}
                >
                  {/* donut ring */}
                  {progressPct !== null && (
                    <svg width={RING_SIZE} height={RING_SIZE} className="shrink-0">
                      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                        fill="none" stroke="#374151" strokeWidth={STROKE} />
                      <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                        fill="none" stroke="#00BBA8" strokeWidth={STROKE}
                        strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                        fill="#f9fafb" fontSize="12" fontWeight="600">
                        {Math.round(progressPct)}%
                      </text>
                    </svg>
                  )}

                  <span className="text-sm text-text flex-1 min-w-0">
                    {acc.account_name}
                    {target && (
                      <span className="block text-sm text-gray-300 mt-0.5">
                        £{parseFloat(acc.balance).toFixed(2)} / £{target.toFixed(2)}
                        {acc.monthly_contribution && (
                          <span className="ml-2 text-accent">· £{parseFloat(acc.monthly_contribution).toFixed(2)}/mo</span>
                        )}
                        {acc.deadline && (
                          <span className="ml-1 text-gray-400">· by {acc.deadline}</span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-text font-medium whitespace-nowrap">
                    £{parseFloat(acc.balance).toFixed(2)} <span className="text-xs text-gray-400">{isOpen ? "▲" : "▼"}</span>
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

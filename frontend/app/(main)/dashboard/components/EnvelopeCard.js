"use client";

import Card from "../../../components/Card";

export default function EnvelopeCard({
  env, isOpen, envTxs, editingEnvelope,
  editEnvName, setEditEnvName, editEnvAmount, setEditEnvAmount,
  onToggle, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onDeleteTx,
}) {
  const balance = parseFloat(env.balance);
  const allocated = parseFloat(env.allocated_amount);
  const pct = allocated > 0 ? Math.max(0, Math.min(100, (balance / allocated) * 100)) : 0;
  const isEditing = editingEnvelope === env.id;
  const hasTxs = envTxs.length > 0;

  return (
    <Card className="p-4 self-start">
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <input
            type="text" value={editEnvName} onChange={(e) => setEditEnvName(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number" min="0" step="0.01" value={editEnvAmount} onChange={(e) => setEditEnvAmount(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-2">
            <button onClick={() => onSaveEdit(env.id)} className="flex-1 px-3 py-1 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors">Save</button>
            <button onClick={onCancelEdit} className="flex-1 px-3 py-1 rounded-lg text-xs font-medium border border-border text-muted hover:text-text transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onToggle}
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

          {/* Edit / Delete buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onStartEdit}
              className="text-xs text-muted hover:text-accent transition-colors"
            >Edit</button>
            {!hasTxs && (
              <button
                onClick={() => onDelete(env.id)}
                className="text-xs text-muted hover:text-negative transition-colors"
              >Delete</button>
            )}
          </div>

          {isOpen && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              {envTxs.length === 0 ? <p className="text-xs text-muted">No transactions yet.</p> : (
                <ul>
                  {envTxs.map((tx) => (
                    <li key={tx.id} className="py-1 flex justify-between items-start">
                      <div>
                        <div className="flex gap-3 items-center text-xs">
                          <span className="text-muted">{tx.description || "—"}</span>
                          <span className="text-negative">-£{parseFloat(tx.amount).toFixed(2)}</span>
                        </div>
                        {tx.date && <p className="text-xs text-muted">{tx.date}</p>}
                      </div>
                      <button
                        onClick={() => onDeleteTx(tx)}
                        className="text-muted hover:text-negative transition-colors text-xs ml-2"
                      >✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

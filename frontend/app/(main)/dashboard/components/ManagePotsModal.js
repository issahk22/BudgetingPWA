"use client";

import { useState } from "react";

export default function ManagePotsModal({ accounts, onEdit, onClose }) {

  const pots = accounts.filter((acc) => acc.account_type === "pot" && acc.target_amount);

  const [editingId, setEditingId] = useState(null);
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  //tomorrow's date as min for deadline
  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  function startEdit(pot) {
    setEditingId(pot.id);
    setEditTarget(parseFloat(pot.target_amount).toFixed(2));
    setEditDeadline(pot.deadline || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTarget("");
    setEditDeadline("");
  }

  function submitEdit(pot) {
    onEdit(pot, parseFloat(editTarget), editDeadline);
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-text">Manage Pots</h3>

      {/* Existing pots with goals */}
      {pots.length === 0 ? (
        <p className="text-sm text-muted">No pots with goals yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pots.map((pot) => (
            <li key={pot.id}>
              {editingId === pot.id ? (
                <div className="flex flex-col gap-2 py-2 border-b border-gray-700">
                  <span className="text-sm text-text font-medium">{pot.account_name}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted w-16">Target</label>
                    <input
                      type="number" min="0" step="0.01" value={editTarget} onChange={(e) => setEditTarget(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted w-16">Deadline</label>
                    <input
                      type="date" value={editDeadline} min={minDate} onChange={(e) => setEditDeadline(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => submitEdit(pot)} className="text-xs text-accent hover:opacity-80 transition-opacity">Save</button>
                    <button onClick={cancelEdit} className="text-xs text-muted hover:text-text transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <div className="flex flex-col">
                    <span className="text-sm text-text">{pot.account_name}</span>
                    <span className="text-xs text-muted">
                      £{parseFloat(pot.balance).toFixed(2)} / £{parseFloat(pot.target_amount).toFixed(2)}
                      {pot.deadline && ` · by ${pot.deadline}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {pot.monthly_contribution && (
                      <span className="text-xs text-accent">£{parseFloat(pot.monthly_contribution).toFixed(2)}/mo</span>
                    )}
                    <button onClick={() => startEdit(pot)} className="text-xs text-muted hover:text-accent transition-colors">Edit</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

    </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function ManageCostsModal({ fixedCosts, onAdd, onEdit, onDelete, onClose }) {

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  function startEdit(cost) {
    setEditingId(cost.id);
    setEditName(cost.cost_name);
    setEditAmount(parseFloat(cost.amount).toFixed(2));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditAmount("");
  }

  function submitEdit(cost) {
    onEdit(cost, editName, parseFloat(editAmount));
    setEditingId(null);
  }

  function handleAdd(e) {
    e.preventDefault();
    onAdd(newName, parseFloat(newAmount));
    setNewName("");
    setNewAmount("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-text">Monthly Costs</h3>

      {/* Existing costs */}
      {fixedCosts.length === 0 ? (
        <p className="text-sm text-muted">No fixed costs yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fixedCosts.map((cost) => (
            <li key={cost.id}>
              {editingId === cost.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button onClick={() => submitEdit(cost)} className="text-xs text-accent hover:opacity-80 transition-opacity">Save</button>
                  <button onClick={cancelEdit} className="text-xs text-muted hover:text-text transition-colors">Cancel</button>
                </div>
              ) : (
                <div className="flex justify-between items-center py-1 border-b border-gray-700">
                  <span className="text-sm text-text">{cost.cost_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text font-medium">£{parseFloat(cost.amount).toFixed(2)}</span>
                    {cost.paid && <span className="text-xs text-positive">Paid</span>}
                    <button onClick={() => startEdit(cost)} className="text-xs text-muted hover:text-accent transition-colors">Edit</button>
                    <button onClick={() => onDelete(cost)} className="text-xs text-muted hover:text-negative transition-colors">Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add new cost */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-gray-700 pt-4">
        <p className="text-xs text-muted font-medium">Add New Cost</p>
        <div className="flex items-center gap-2">
          <input
            type="text" required placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number" required min="0.01" step="0.01" placeholder="£0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
            className="w-24 px-3 py-1.5 bg-gray-700 border border-border rounded-lg text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors">Add</button>
        </div>
      </form>

    </div>
    </div>
  );
}

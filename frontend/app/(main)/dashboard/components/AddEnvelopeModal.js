"use client";

export default function AddEnvelopeModal({ newEnvName, setNewEnvName, newEnvAmount, setNewEnvAmount, onSubmit, onClose, leftToBudget }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
      <h3 className="text-text mb-1">Add Envelope</h3>

      <div className="flex justify-between items-center text-sm bg-gray-800 rounded-lg px-3 py-2">
        <span className="text-muted">Left to budget</span>
        <span className={leftToBudget < 0 ? "text-negative font-medium" : "text-accent font-medium"}>
          £{(leftToBudget ?? 0).toFixed(2)}
        </span>
      </div>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Name
        <input type="text" required value={newEnvName} onChange={(e) => setNewEnvName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Amount (£)
        <input type="number" min="0" step="0.01" required value={newEnvAmount} onChange={(e) => setNewEnvAmount(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <button type="submit" className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors">
        Save
      </button>
    </form>
    </div>
  );
}

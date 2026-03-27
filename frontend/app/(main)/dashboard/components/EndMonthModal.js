"use client";

export default function EndMonthModal({ netIncome, setNetIncome, closingMonth, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
      <h3 className="text-text mb-1">End Month</h3>
      <p className="text-sm text-muted">This will close the current month and archive all data to history.</p>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Net Income (for next month)
        <input type="number" required min="0" step="0.01" value={netIncome} onChange={(e) => setNetIncome(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <button type="submit" disabled={closingMonth}
        className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {closingMonth ? "Closing..." : "Confirm End Month"}
      </button>
    </form>
    </div>
  );
}

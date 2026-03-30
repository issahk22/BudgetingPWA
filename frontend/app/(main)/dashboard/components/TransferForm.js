"use client";

export default function TransferForm({ transferForm, setTransferForm, accounts, transferring, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
      <h3 className="text-text mb-1">Transfer Between Accounts</h3>

      <label className="flex flex-col gap-1 text-sm text-muted">
        From
        <select required value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">Select account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        To
        <select required value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">Select account</option>
          {accounts
            .filter((acc) => acc.id !== transferForm.from_account_id)
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name} ({acc.account_type}) — £{parseFloat(acc.balance).toFixed(2)}
              </option>
            ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Amount
        <input type="number" required min="0.01" step="0.01" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Date
        <input type="date" value={transferForm.date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Description (optional)
        <input type="text" maxLength={80} value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <button type="submit" disabled={transferring}
        className="w-full px-4 py-2 rounded-lg bg-accent text-gray-900 font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {transferring ? "Transferring..." : "Confirm Transfer"}
      </button>
    </form>
    </div>
  );
}

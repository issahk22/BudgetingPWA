"use client";

export default function TransactionForm({ form, setForm, envelopes, accounts, submitting, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
      <h3 className="text-text mb-1">New Transaction</h3>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Envelope
        <select required value={form.envelope_id} onChange={(e) => setForm({ ...form, envelope_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">Select envelope</option>
          {envelopes.map((env) => (
            <option key={env.id} value={env.id}>{env.envelope_name} : £{parseFloat(env.balance).toFixed(2)}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Account
        <select required value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">Select account</option>
          {accounts.filter((acc) => acc.account_type === "bank").map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_name} : £{parseFloat(acc.balance).toFixed(2)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Amount
        <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Date
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Description (optional)
        <input type="text" maxLength={80} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <button type="submit" disabled={submitting}
        className="w-full px-4 py-2 rounded-lg bg-accent text-gray-900 font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? "Saving..." : "Save Transaction"}
      </button>
    </form>
    </div>
  );
}

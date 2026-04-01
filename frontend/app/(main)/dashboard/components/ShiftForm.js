"use client";

export default function ShiftForm({ shiftForm, setShiftForm, jobs, shiftTypes, submittingShift, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={onClose}>
    <form className="bg-card border border-border rounded-xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
      <h3 className="text-text mb-1">Log Shift</h3>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Job
        <select required value={shiftForm.job_id} onChange={(e) => setShiftForm({ ...shiftForm, job_id: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">Select job</option>
          {jobs.map((job) => (
            <option key={job.job_id} value={job.job_id}>{job.job_name} — £{parseFloat(job.base_hourly_rate).toFixed(2)}/hr</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Date
        <input type="date" required value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Paid Hours Worked
        <input type="number" required min="0.5" step="0.5" value={shiftForm.hours_worked} onChange={(e) => setShiftForm({ ...shiftForm, hours_worked: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Shift Type
        <select required value={shiftForm.shift_type} onChange={(e) => setShiftForm({ ...shiftForm, shift_type: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">Select shift type</option>
          {shiftTypes.map((t) => (
            <option key={t.id} value={t.type_name}>{t.type_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Rate Multiplier (optional)
        <input type="number" min="1" step="0.05" placeholder="e.g. 1.5" value={shiftForm.rate_multiplier} onChange={(e) => setShiftForm({ ...shiftForm, rate_multiplier: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </label>

      <button type="submit" disabled={submittingShift}
        className="w-full px-4 py-2 rounded-lg bg-accent text-gray-900 font-medium text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {submittingShift ? "Saving..." : "Log Shift"}
      </button>
    </form>
    </div>
  );
}

"use client";

import Card from "../../../components/Card";

export default function ShiftsCard({ shifts, totalMonthlyPay, getJobName, formatShiftType }) {
  return (
    <Card>
      <h2 className="text-text mb-1">Shifts</h2>
      <p className="text-lg font-bold text-accent mb-3">£{totalMonthlyPay.toFixed(2)} <span className="text-xs text-muted font-normal">this month</span></p>

      {shifts.length === 0 ? <p className="text-sm text-muted">No shifts logged yet.</p> : (
        <ul>
          {shifts.map((shift) => (
            <li key={shift.shift_id} className="py-2 border-b border-gray-700 last:border-0">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text">
                  {getJobName(shift.job_id)} <span className="text-xs text-muted">· {formatShiftType(shift.shift_type)}</span>
                </span>
                <span className="text-text font-medium">£{parseFloat(shift.total_pay).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted mt-0.5">{shift.date} · {shift.hours_worked}hrs · x{shift.rate_multiplier}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

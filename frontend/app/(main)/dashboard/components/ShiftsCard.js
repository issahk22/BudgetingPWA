"use client";

import { useState } from "react";
import Card from "../../../components/Card";

export default function ShiftsCard({ shifts, totalMonthlyPay, getJobName, formatShiftType }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left focus:outline-none"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-text">Shifts</h2>
          <span className="text-muted text-xs">{open ? "▲" : "▼"}</span>
        </div>

        <div className="flex justify-between items-end mt-1">
          <span className="text-sm text-muted">{shifts.length} shift{shifts.length !== 1 ? "s" : ""} worked</span>
          <span className="text-lg font-bold text-accent">~£{totalMonthlyPay.toFixed(2)}</span>
        </div>
      </button>

      {open && (
        <div className="mt-3 border-t border-gray-700 pt-3">
          {shifts.length === 0 ? (
            <p className="text-sm text-muted">No shifts logged yet.</p>
          ) : (
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
        </div>
      )}
    </Card>
  );
}

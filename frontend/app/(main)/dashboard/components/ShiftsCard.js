"use client";

import { useState } from "react";
import Card from "../../../components/Card";

export default function ShiftsCard({ shifts, totalMonthlyPay, getJobName, formatShiftType, onAddShift, onDeleteShift }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className="flex justify-between items-center">
        <button onClick={() => setOpen((v) => !v)} className="flex-1 text-left focus:outline-none">
          <h2 className="text-text">Shifts</h2>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddShift(); }}
            className="px-3 py-1 rounded-lg font-medium text-sm transition-colors bg-accent text-white hover:bg-accent-hover"
          >
            +
          </button>
          <button onClick={() => setOpen((v) => !v)} className="text-muted text-xs focus:outline-none">
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>
      <div className="flex justify-between items-end mt-1 cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <span className="text-sm text-muted">{shifts.length} shift{shifts.length !== 1 ? "s" : ""} worked</span>
        <span className="text-lg font-bold text-accent">~£{totalMonthlyPay.toFixed(2)}</span>
      </div>

      {open && (
        <div className="mt-3 border-t border-gray-700 pt-3">
          {shifts.length === 0 ? (
            <p className="text-sm text-muted">No shifts logged yet.</p>
          ) : (
            <ul>
              {shifts.map((shift) => (
                <li key={shift.shift_id} className="py-2 border-b border-gray-700 last:border-0 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text">
                        {getJobName(shift.job_id)} <span className="text-xs text-muted">· {formatShiftType(shift.shift_type)}</span>
                      </span>
                      <span className="text-text font-medium">£{parseFloat(shift.total_pay).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{shift.date} · {shift.hours_worked}hrs · x{shift.rate_multiplier}</p>
                  </div>
                  <button
                    onClick={() => onDeleteShift(shift)}
                    className="text-muted hover:text-negative transition-colors text-xs ml-2"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

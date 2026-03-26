"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Employment() {

  const router = useRouter();
  const { data, update } = useOnboarding();
  const [input, setInput] = useState({ job_name: "", base_hourly_rate: "" });

  // shift type editing state
  const MAX_SHIFT_TYPES = 5;
  const [editingType, setEditingType] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newType, setNewType] = useState("");


  function addJob() {
    if (!input.job_name || !input.base_hourly_rate) return;
    update({ jobs: [...data.jobs, input] });
    setInput({ job_name: "", base_hourly_rate: "" });
  }


  function removeJob(i) {
    update({ jobs: data.jobs.filter((_, idx) => idx !== i) });
  }


  // shift type management (max 5)
  function addShiftType() {
    const formatted = newType.trim().toLowerCase().replace(/\s+/g, "_");
    if (!formatted || data.shiftTypes.length >= MAX_SHIFT_TYPES) return;
    if (data.shiftTypes.includes(formatted)) return;
    update({ shiftTypes: [...data.shiftTypes, formatted] });
    setNewType("");
  }

  function removeShiftType(i) {
    update({ shiftTypes: data.shiftTypes.filter((_, idx) => idx !== i) });
  }

  function startEditType(i) {
    setEditingType(i);
    setEditValue(data.shiftTypes[i].replace(/_/g, " "));
  }

  function saveEditType(i) {
    const formatted = editValue.trim().toLowerCase().replace(/\s+/g, "_");
    if (!formatted) return;
    const updated = [...data.shiftTypes];
    updated[i] = formatted;
    update({ shiftTypes: updated });
    setEditingType(null);
    setEditValue("");
  }

  return (

    <div className="ob-card">

        <h1 className="text-2xl font-semibold mb-6">Employment</h1>

        <div className="flex gap-2 mb-3">

          <input
            type="text"
            placeholder="e.g. Nurse"
            maxLength={30}
            value={input.job_name}
            onChange={(e) => setInput({ ...input, job_name: e.target.value })}
            className="flex-1 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder=" Base hourly rate (£)"
            min="0"
            step="0.01"
            value={input.base_hourly_rate}
            onChange={(e) => setInput({ ...input, base_hourly_rate: e.target.value })}
            className="w-36 rounded px-3 py-2 text-sm"
          />

        </div>

        <button
          onClick={addJob}
          className="btn-outline w-full mb-4"
        >
          Add Job
        </button>

        {data.jobs.map((job, i) => (
          <div key={i} className="list-item flex justify-between items-center text-sm py-1">
            <span>{job.job_name}: £{parseFloat(job.base_hourly_rate).toFixed(2)}/hr</span>
            <button onClick={() => removeJob(i)} className="btn-remove">Remove</button>
          </div>
        ))}


        {/* Shift Types */}
        <h2 className="text-lg font-semibold mt-6 mb-3">Shift Types</h2>
        <p className="text-xs mb-2">Max {MAX_SHIFT_TYPES} types. Click a type to edit it.</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {data.shiftTypes.map((type, i) => (
            <div key={i} className="pill flex items-center gap-1">
              {editingType === i ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEditType(i)}
                  onKeyDown={(e) => e.key === "Enter" && saveEditType(i)}
                  autoFocus
                />
              ) : (
                <span
                  className="text-sm cursor-pointer"
                  onClick={() => startEditType(i)}
                >
                  {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
              <button onClick={() => removeShiftType(i)} className="pill-remove">✕</button>
            </div>
          ))}
        </div>

        {data.shiftTypes.length < MAX_SHIFT_TYPES && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="New shift type"
              maxLength={20}
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addShiftType()}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={addShiftType}
              className="btn-outline"
            >
              Add
            </button>
          </div>
        )}


        <button
          onClick={() => router.push("/onboarding/3.goals")}
          className="btn-primary w-full mt-6"
        >
          Next
        </button>

    </div>
  );
}

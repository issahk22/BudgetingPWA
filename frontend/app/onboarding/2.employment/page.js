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
  const [newMultiplier, setNewMultiplier] = useState("1.000");


  function addJob() {
    if (!input.job_name || !input.base_hourly_rate) return;
    if (data.jobs.length >= 1) return; // PROTOTYPE RESTRICTION: max 1 job
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
    if (data.shiftTypes.some((t) => t.type_name === formatted)) return;
    update({ shiftTypes: [...data.shiftTypes, { type_name: formatted, rate_multiplier: newMultiplier || "1.000" }] });
    setNewType("");
    setNewMultiplier("1.000");
  }

  function removeShiftType(i) {
    update({ shiftTypes: data.shiftTypes.filter((_, idx) => idx !== i) });
  }

  function startEditType(i) {
    setEditingType(i);
    setEditValue(data.shiftTypes[i].type_name.replace(/_/g, " "));
  }

  function saveEditType(i) {
    const formatted = editValue.trim().toLowerCase().replace(/\s+/g, "_");
    if (!formatted) return;
    const updated = [...data.shiftTypes];
    updated[i] = { ...updated[i], type_name: formatted };
    update({ shiftTypes: updated });
    setEditingType(null);
    setEditValue("");
  }

  function updateMultiplier(i, value) {
    const updated = [...data.shiftTypes];
    updated[i] = { ...updated[i], rate_multiplier: value };
    update({ shiftTypes: updated });
  }

  return (

    <div className="ob-card">

        <h1 className="text-2xl font-semibold mb-6">Employment</h1>

        
        {data.jobs.length === 0 ? (
          <>
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
          </>
        ) : (
          data.jobs.map((job, i) => (
            <div key={i} className="list-item flex justify-between items-center text-sm py-1">
              <span>{job.job_name}: £{parseFloat(job.base_hourly_rate).toFixed(2)}/hr</span>
              <button onClick={() => removeJob(i)} className="btn-remove">Remove</button>
            </div>
          ))
        )}


        {/* Shift Types */}
        <h2 className="text-lg font-semibold mt-6 mb-3">Shift Types</h2>
        <p className="text-xs mb-2">Max {MAX_SHIFT_TYPES} types. Click a name to edit it.</p>

        <div className="flex flex-col gap-2 mb-3">
          {data.shiftTypes.map((type, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#262626] rounded-lg px-3 py-2">
              {editingType === i ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEditType(i)}
                  onKeyDown={(e) => e.key === "Enter" && saveEditType(i)}
                  autoFocus
                  className="flex-1 rounded px-2 py-1 text-sm"
                />
              ) : (
                <span
                  className="flex-1 text-sm cursor-pointer text-text"
                  onClick={() => startEditType(i)}
                >
                  {type.type_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
              <span className="text-xs text-muted">×</span>
              <input
                type="number"
                min="0.5"
                step="0.05"
                value={type.rate_multiplier}
                onChange={(e) => updateMultiplier(i, e.target.value)}
                className="w-20 rounded px-2 py-1 text-sm text-center"
              />
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
            <input
              type="number"
              min="0.5"
              step="0.05"
              placeholder="×1.000"
              value={newMultiplier}
              onChange={(e) => setNewMultiplier(e.target.value)}
              className="w-24 rounded px-3 py-2 text-sm text-center"
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
          onClick={() => data.jobs.length >= 1 && router.push("/onboarding/4.accounts")}
          disabled={data.jobs.length === 0}
          className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>

    </div>
  );
}

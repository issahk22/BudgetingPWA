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

    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Employment</h1>

        <div className="flex gap-2 mb-3">

          <input
            type="text"
            placeholder="Job name"
            maxLength={30}
            value={input.job_name}
            onChange={(e) => setInput({ ...input, job_name: e.target.value })}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder=" Base hourly rate (£)"
            min="0"
            step="0.01"
            value={input.base_hourly_rate}
            onChange={(e) => setInput({ ...input, base_hourly_rate: e.target.value })}
            className="w-36 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        <button
          onClick={addJob}
          className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-4"
        >
          Add Job
        </button>

        {data.jobs.map((job, i) => (
          <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
            <span>{job.job_name}: £{parseFloat(job.base_hourly_rate).toFixed(2)}/hr</span>
            <button onClick={() => removeJob(i)} className="text-red-500 text-xs">Remove</button>
          </div>
        ))}


        {/* Shift Types */}
        <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Shift Types</h2>
        <p className="text-xs text-gray-500 mb-2">Max {MAX_SHIFT_TYPES} types. Click a type to edit it.</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {data.shiftTypes.map((type, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
              {editingType === i ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEditType(i)}
                  onKeyDown={(e) => e.key === "Enter" && saveEditType(i)}
                  className="bg-transparent text-sm w-24 focus:outline-none"
                  autoFocus
                />
              ) : (
                <span
                  className="text-sm text-gray-700 cursor-pointer"
                  onClick={() => startEditType(i)}
                >
                  {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
              <button onClick={() => removeShiftType(i)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
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
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addShiftType}
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50"
            >
              Add
            </button>
          </div>
        )}


        <button
          onClick={() => router.push("/onboarding/3.goals")}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full mt-6"
        >
          Next
        </button>

      </div>
    </div>
  );
}

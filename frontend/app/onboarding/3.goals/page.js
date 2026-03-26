"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Goals() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <div className="ob-card">

        <h1 className="text-2xl font-semibold mb-6">
          Goals
        </h1>

        <div className="mb-4">

          <label className="block text-sm font-medium mb-1">
            Savings Goal (£)</label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={data.goal}
            onChange={(e) => update({ goal: e.target.value })}

            className="w-full rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">

          <label className="block text-sm font-medium mb-1">
            Current Savings (£) <span className="font-normal" style={{ color: "#6b7280" }}>(optional)</span>
          </label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={data.currentSavings}
            onChange={(e) => update({ currentSavings: e.target.value })}

            className="w-full rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-6">

          <label className="block text-sm font-medium mb-1">
            Deadline</label>
          <input
            type="date"
            value={data.goalDeadline}
            onChange={(e) => update({ goalDeadline: e.target.value })}

            className="w-full rounded px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={() => router.push("/onboarding/4.accounts")}
          className="btn-primary w-full"
        >
          Next
        </button>

    </div>
  );
}

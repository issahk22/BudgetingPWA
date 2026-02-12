"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Goals() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Goals
        </h1>

        <div className="mb-4">

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Savings Goal (£)</label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={data.savingsGoal}
            onChange={(e) => update({ savingsGoal: e.target.value })}

            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Savings (£) <span className="text-gray-400 font-normal">— optional</span>
          </label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={data.currentSavings}
            onChange={(e) => update({ currentSavings: e.target.value })}

            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline</label>
          <input
            type="date"
            value={data.savingsDeadline}
            onChange={(e) => update({ savingsDeadline: e.target.value })}

            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => router.push("/onboarding/3.accounts")}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full"
        >
          Next
        </button>

      </div>
    </div>
  );
}

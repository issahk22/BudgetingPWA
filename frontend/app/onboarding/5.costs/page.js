"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Costs() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [input, setInput] = useState({ name: "", amount: "", paid: false });

  function addCost() {
    if (!input.name) return;
    update({ fixedCosts: [...data.fixedCosts, input] });
    setInput({ name: "", amount: "", paid: false });
  }

  function removeCost(i) {
    update({ fixedCosts: data.fixedCosts.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">


        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Fixed Monthly Costs</h1>


        <div className="flex gap-2 mb-3">

          <input
            type="text"
            placeholder="Cost name"
            maxLength={30}
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}

            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Amount (£)"
            min="0"
            step="0.01"
            value={input.amount}
            onChange={(e) => setInput({ ...input, amount: e.target.value })}

            className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={input.paid}
            onChange={(e) => setInput({ ...input, paid: e.target.checked })}
            className="w-4 h-4 accent-blue-600"
          />
          Already paid this month
        </label>


        <button onClick={addCost} className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-3">
          Add Cost
        </button>

        {/* list of added costs with remove buttons */}
        {data.fixedCosts.map((cost, i) => (
          <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
            <span>{cost.name}: £{cost.amount}{cost.paid && <span className="text-green-600 ml-1">(paid)</span>}</span>
            <button onClick={() => removeCost(i)} className="text-red-500 text-xs">Remove</button>
          </div>
        ))}

        <button
          onClick={() => router.push("/onboarding/6.envelopes")}

          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full mt-6"
        >
          Next
        </button>

      </div>
    </div>
  );
}

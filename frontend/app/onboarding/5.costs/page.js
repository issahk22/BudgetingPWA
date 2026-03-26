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
    <div className="ob-card">


        <h1 className="text-2xl font-semibold mb-6">
          Fixed Monthly Costs</h1>


        <div className="flex gap-2 mb-3">

          <input
            type="text"
            placeholder="Cost name"
            maxLength={30}
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}

            className="flex-1 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder="Amount (£)"
            min="0"
            step="0.01"
            value={input.amount}
            onChange={(e) => setInput({ ...input, amount: e.target.value })}

            className="w-32 rounded px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={input.paid}
            onChange={(e) => setInput({ ...input, paid: e.target.checked })}
            className="w-4 h-4"
          />
          Already paid this month
        </label>


        <button onClick={addCost} className="btn-outline w-full mb-3">
          Add Cost
        </button>

        {/* list of added costs with remove buttons */}
        {data.fixedCosts.map((cost, i) => (
          <div key={i} className="list-item flex justify-between items-center text-sm py-1">
            <span>{cost.name}: £{cost.amount}{cost.paid && <span className="paid-tag ml-1">(paid)</span>}</span>
            <button onClick={() => removeCost(i)} className="btn-remove">Remove</button>
          </div>
        ))}

        <button
          onClick={() => router.push("/onboarding/6.envelopes")}

          className="btn-primary w-full mt-6"
        >
          Next
        </button>

    </div>
  );
}

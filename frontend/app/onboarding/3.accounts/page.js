"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Accounts() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [input, setInput] = useState({ name: "", balance: "", type: "bank" });


  function addAccount() {
    if (!input.name) return;
    update({
      accounts: [
        ...data.accounts,
        {
          name: input.name,
          balance: input.balance,
          type: input.type,
          // pots are excluded from budget by default
          include_in_budget: input.type === "bank",
        },
      ],
    });
    setInput({ name: "", balance: "", type: "bank" });
  }


  function removeAccount(i) {
    update({ accounts: data.accounts.filter((_, idx) => idx !== i) });
  }


  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Accounts</h1>

        <div className="flex gap-2 mb-2">

          <input
            type="text"
            placeholder="Account name"
            maxLength={30}
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Balance (£)"
            min="0"
            step="0.01"
            value={input.balance}
            onChange={(e) => setInput({ ...input, balance: e.target.value })}
            className="w-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={input.type}
            onChange={(e) => setInput({ ...input, type: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bank">Bank</option>
            <option value="pot">Pot</option>
          </select>

        </div>

        <button
          onClick={addAccount}
          className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-4"
        >
          Add Account
        </button>


        {/* list of added accounts */}
        {data.accounts.map((acc, i) => (
          <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
            <span>{acc.name}: £{acc.balance}</span>
            <span className="text-xs text-gray-400 capitalize">{acc.type}</span>
            <button onClick={() => removeAccount(i)} className="text-red-500 text-xs">Remove</button>
          </div>
        ))}


        <button
          onClick={() => router.push("/onboarding/4.costs")}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full mt-6"
        >
          Next
        </button>

      </div>
    </div>
  );
}

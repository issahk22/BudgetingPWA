"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Accounts() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [input, setInput] = useState({ name: "", balance: "", type: "bank", target_amount: "", deadline: "" });


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
          //optional savings goal fields (only pots)
          target_amount: input.type === "pot" ? input.target_amount : "",
          deadline: input.type === "pot" ? input.deadline : "",
        },
      ],
    });
    setInput({ name: "", balance: "", type: "bank", target_amount: "", deadline: "" });
  }


  function removeAccount(i) {
    update({ accounts: data.accounts.filter((_, idx) => idx !== i) });
  }


  return (
    <div className="ob-card">

        <h1 className="text-2xl font-semibold mb-6">Accounts</h1>

        <div className="flex gap-2 mb-2">

          <input
            type="text"
            placeholder="Account name"
            maxLength={30}
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            className="flex-1 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder="Balance (£)"
            min="0"
            step="0.01"
            value={input.balance}
            onChange={(e) => setInput({ ...input, balance: e.target.value })}
            className="w-28 rounded px-3 py-2 text-sm"
          />

          <select
            value={input.type}
            onChange={(e) => setInput({ ...input, type: e.target.value })}
            className="rounded px-3 py-2 text-sm"
          >
            <option value="bank">Bank</option>
            <option value="pot">Pot</option>
          </select>

        </div>

        {/* extra fields the type is a pot, sets a savings goal for the pot */}
        {input.type === "pot" && (
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Target (£)"
              min="0"
              step="0.01"
              value={input.target_amount}
              onChange={(e) => setInput({ ...input, target_amount: e.target.value })}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={input.deadline}
              onChange={(e) => setInput({ ...input, deadline: e.target.value })}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          onClick={addAccount}
          className="btn-outline w-full mb-4"
        >
          Add Account
        </button>


        {/* list of added accounts */}
        {data.accounts.map((acc, i) => (
          <div key={i} className="list-item flex justify-between items-center text-sm py-2 gap-4">
            <span className="flex-1">
              <span className="type-label">({acc.type})</span> {acc.name}: £{acc.balance}
              {acc.type === "pot" && acc.target_amount && (
                <span className="text-xs" style={{ color: "#6b7280" }}> — goal £{acc.target_amount}{acc.deadline ? ` by ${acc.deadline}` : ""}</span>
              )}
            </span>
            <button onClick={() => removeAccount(i)} className="btn-remove">Remove</button>
          </div>
        ))}


        <button
          onClick={() => router.push("/onboarding/5.costs")}
          className="btn-primary w-full mt-6"
        >
          Next
        </button>

    </div>
  );
}

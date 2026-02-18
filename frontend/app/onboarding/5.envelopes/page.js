"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

const API = "http://localhost:8000";

export default function Envelopes() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [input, setInput] = useState({ name: "", amount: "" });



  const totalBudget = data.bankAccounts.reduce(
    (sum, acc) => sum + (parseFloat(acc.balance) || 0),
    0
  );

  const totalAllocated = data.envelopes.reduce(
    (sum, env) => sum + (parseFloat(env.amount) || 0),
    0
  );

  const amntRemaining = totalBudget - totalAllocated;





  function addEnvelope() {
    if (!input.name) return;
    update({ envelopes: [...data.envelopes, input] });
    setInput({ name: "", amount: "" });
  }

  function removeEnvelope(i) {
    update({ envelopes: data.envelopes.filter((_, idx) => idx !== i) });
  }





  async function handleFinish() { //to push everything to db 
    try {

      // user
      await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username }),
      });

      //goals
      if (data.goal) {
        await fetch(`${API}/goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_amount: parseFloat(data.goal),
            current_savings: data.currentSavings ? parseFloat(data.currentSavings) : null,
            deadline: data.goalDeadline || null,
          }),
        });
      }

      //accounts
      for (const acc of data.bankAccounts) {
        await fetch(`${API}/bank-accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account_name: acc.name, balance: parseFloat(acc.balance) || 0 }), //0 added as a fallback 
        });
      }

      //  pots 
      for (const pot of data.pots) {
        await fetch(`${API}/pots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pot_name: pot.name, balance: parseFloat(pot.balance) || 0 }), 
        });
      }

      //monthly/fixed costs
      for (const cost of data.fixedCosts) {
        await fetch(`${API}/fixed-costs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cost_name: cost.name, amount: parseFloat(cost.amount) || 0, paid: cost.paid }),
        });
      }

      //envelopes
      for (const env of data.envelopes) {
        await fetch(`${API}/envelopes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ envelope_name: env.name, allocated_amount: parseFloat(env.amount) || 0 }),
        });
      }

      router.push("/dashboard");

    } catch (err) {
      console.error("Failed to save onboarding data:", err);
    }
  }





  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1
         className="text-2xl font-semibold text-gray-800 mb-6">
        Envelopes
          </h1>



        <div className="mb-5 p-3 rounded bg-gray-50 border border-gray-200 text-sm flex justify-between">
          <span className="text-gray-500">Total budget: £{totalBudget.toFixed(2)}</span>
          <span className={amntRemaining < 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
            Left to budget: £{amntRemaining.toFixed(2)}
          </span>
        </div>



        <div className="flex gap-2 mb-3">

          <input
            type="text"
            placeholder="Envelope name"
            maxLength={30}
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}

            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="£"
            min="0"
            step="0.01"
            value={input.amount}
            onChange={(e) => setInput({ ...input, amount: e.target.value })}

            className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        <button onClick={addEnvelope} className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-3">
          Add Envelope
        </button>

        {/* list of added envelopes with delete buttons */}
        {data.envelopes.map((env, i) => (
          <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
            <span>{env.name}: £{env.amount}</span>
            <button onClick={() => removeEnvelope(i)} className="text-red-500 text-xs">Remove</button>
          </div>
        ))}

        <button
          onClick={handleFinish}

          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full mt-6"
        >
          Finish
        </button>

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

const API = "http://localhost:8000";

export default function Envelopes() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [input, setInput] = useState({ name: "", amount: "" });



  // only accounts (include_in_budget) are in the amount left to budget
  const totalBudget = data.accounts
    .filter((acc) => acc.include_in_budget)
    .reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

  // deducts unpaid fixed costs from amount remaining
  const unpaidFixedCosts = data.fixedCosts
    .filter((cost) => !cost.paid)
    .reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

  const totalAllocated = data.envelopes.reduce(
    (sum, env) => sum + (parseFloat(env.amount) || 0),
    0
  );

  const amntRemaining = totalBudget - unpaidFixedCosts - totalAllocated;




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

      // accounts (pots can carry a savings goal via target_amount + deadline)
      for (const acc of data.accounts) {
        await fetch(`${API}/accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_name: acc.name,
            balance: parseFloat(acc.balance) || 0,
            account_type: acc.type,
            include_in_budget: acc.include_in_budget,
            target_amount: acc.target_amount ? parseFloat(acc.target_amount) : null,
            deadline: acc.deadline || null,
          }),
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

      // jobs
      for (const job of data.jobs) {
        await fetch(`${API}/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_name: job.job_name,
            base_hourly_rate: parseFloat(job.base_hourly_rate) || 0,
          }),
        });
      }

      // shift types
      for (const type of data.shiftTypes) {
        await fetch(`${API}/shift-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type_name: type }),
        });
      }

      if (data.pin) {
        await fetch(`${API}/auth/set-pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: data.pin }),
        });
      }

      router.push("/dashboard");

    } catch (err) {
      console.error("Failed to save onboarding data:", err);
    }
  }




  return (
    <div className="ob-card">

        <h1
         className="text-2xl font-semibold mb-6">
        Envelopes
          </h1>



        <div className="budget-bar mb-5 text-sm flex justify-between">
          <span className="budget-label">Total budget: £{totalBudget.toFixed(2)}</span>
          <span className={amntRemaining < 0 ? "font-semibold budget-negative" : "font-semibold budget-positive"}>
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

            className="flex-1 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder="£"
            min="0"
            step="0.01"
            value={input.amount}
            onChange={(e) => setInput({ ...input, amount: e.target.value })}

            className="w-32 rounded px-3 py-2 text-sm"
          />

        </div>

        <button onClick={addEnvelope} className="btn-outline w-full mb-3">
          Add Envelope
        </button>

        {/* list of added envelopes with delete buttons */}
        {data.envelopes.map((env, i) => (
          <div key={i} className="list-item flex justify-between items-center text-sm py-1">
            <span>{env.name}: £{env.amount}</span>
            <button onClick={() => removeEnvelope(i)} className="btn-remove">Remove</button>
          </div>
        ))}

        <button
          onClick={handleFinish}

          className="btn-primary w-full mt-6"
        >
          Finish
        </button>

    </div>
  );
}

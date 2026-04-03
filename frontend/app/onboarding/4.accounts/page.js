"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Accounts() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [bankInput, setBankInput] = useState({ name: "", balance: "" });
  const [potInput, setPotInput] = useState({ name: "", balance: "", target_amount: "", deadline: "" });

  const banks = data.accounts.filter((a) => a.type === "bank");
  const pots  = data.accounts.filter((a) => a.type === "pot");


  function addBank() {
    if (!bankInput.name || !bankInput.balance) return;
    if (banks.length >= 1) return; // prototype: max 1 bank account
    update({
      accounts: [
        ...data.accounts,
        { name: bankInput.name, balance: bankInput.balance, type: "bank", include_in_budget: true, target_amount: "", deadline: "" },
      ],
    });
    setBankInput({ name: "", balance: "" });
  }

  function addPot() {
    if (!potInput.name || !potInput.balance || !potInput.target_amount || !potInput.deadline) return;
    if (pots.length >= 1) return; //PROTOTYPE RESTRICTION: max 1 pot
    update({
      accounts: [
        ...data.accounts,
        { name: potInput.name, balance: potInput.balance, type: "pot", include_in_budget: false, target_amount: potInput.target_amount, deadline: potInput.deadline },
      ],
    });
    setPotInput({ name: "", balance: "", target_amount: "", deadline: "" });
  }

  function removeAccount(i) {
    update({ accounts: data.accounts.filter((_, idx) => idx !== i) });
  }


  return (
    <div className="ob-card">

      <h1 className="text-2xl font-semibold mb-6">Accounts</h1>

      {/* ── Bank Account ── */}
      <h2 className="text-lg font-semibold mb-1">Bank Account</h2>
      <p className="text-s text-muted mb-3">Main bank accounts included in budget </p>

      {banks.length === 0 ? (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Account name"
              maxLength={30}
              value={bankInput.name}
              onChange={(e) => setBankInput({ ...bankInput, name: e.target.value })}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Balance (£)"
              min="0"
              step="0.01"
              value={bankInput.balance}
              onChange={(e) => setBankInput({ ...bankInput, balance: e.target.value })}
              className="w-28 rounded px-3 py-2 text-sm"
            />
          </div>
          <button onClick={addBank} className="btn-outline w-full mb-6">
            Add Bank Account
          </button>
        </>
      ) : (
        banks.map((acc, i) => {
          const globalIdx = data.accounts.indexOf(acc);
          return (
            <div key={i} className="list-item flex justify-between items-center text-sm py-2 gap-4 mb-6">
              <span className="flex-1">{acc.name}: £{parseFloat(acc.balance).toFixed(2)}</span>
              <button onClick={() => removeAccount(globalIdx)} className="btn-remove">Remove</button>
            </div>
          );
        })
      )}


      {/* ── Savings Pot ── */}
      <h2 className="text-lg font-semibold mb-1">Savings Pot</h2>
      <p className="text-s text-muted mb-3">Savings pot with goal</p>

      {pots.map((acc, i) => {
        const globalIdx = data.accounts.indexOf(acc);
        return (
          <div key={i} className="list-item flex justify-between items-center text-sm py-2 gap-4 mb-1">
            <span className="flex-1">
              {acc.name}: £{parseFloat(acc.balance).toFixed(2)}
              {acc.target_amount && (
                <span className="text-xs text-muted"> · Goal: £{acc.target_amount}{acc.deadline ? ` by ${acc.deadline}` : ""}</span>
              )}
            </span>
            <button onClick={() => removeAccount(globalIdx)} className="btn-remove">Remove</button>
          </div>
        );
      })}

      {pots.length === 0 && (
        <>
          <div className="flex gap-2 mb-2 mt-2">
            <input
              type="text"
              placeholder="Pot name"
              maxLength={30}
              value={potInput.name}
              onChange={(e) => setPotInput({ ...potInput, name: e.target.value })}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Balance (£)"
              min="0"
              step="0.01"
              value={potInput.balance}
              onChange={(e) => setPotInput({ ...potInput, balance: e.target.value })}
              className="w-28 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Target (£) *"
              min="0"
              step="0.01"
              required
              value={potInput.target_amount}
              onChange={(e) => setPotInput({ ...potInput, target_amount: e.target.value })}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
            <input
              type="date"
              required
              value={potInput.deadline}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              onChange={(e) => setPotInput({ ...potInput, deadline: e.target.value })}
              className="flex-1 rounded px-3 py-2 text-sm"
            />
          </div>
          <button onClick={addPot} className="btn-outline w-full mb-2">
            Add Savings Pot
          </button>
        </>
      )}


      <button
        onClick={() => router.push("/onboarding/5.costs")}
        className="btn-primary w-full mt-6"
      >
        Next
      </button>

    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Accounts() {
  const router = useRouter();
  const { data, update } = useOnboarding();

 //states for currnent rows before adding it to the list
  const [accountInput, setAccountInput] = useState({ name: "", balance: "" });
  const [potInput, setPotInput] = useState({ name: "", balance: "" });



  function addAccount() {
    if (!accountInput.name) return;
    update({ bankAccounts: [...data.bankAccounts, accountInput] });
    setAccountInput({ name: "", balance: "" });
  }


  function removeAccount(i) {
    update({ bankAccounts: data.bankAccounts.filter((_, idx) => idx !== i) });
  }



  function addPot() {
    if (!potInput.name) return;
    update({ pots: [...data.pots, potInput] });
    setPotInput({ name: "", balance: "" });
  }


  
  function removePot(i) {
    update({ pots: data.pots.filter((_, idx) => idx !== i) });
  }

  return (


    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Bank Accounts / Pots
          </h1>



        <section className="mb-6">

          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Current Accounts
            </h2>

          <div className="flex gap-2 mb-2">

            <input
              type="text"
              placeholder="Account name"
              maxLength={30}
              value={accountInput.name}
              onChange={(e) => setAccountInput({ ...accountInput, name: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Balance (£)"
              min="0"
              step="0.01"
              value={accountInput.balance}
              onChange={(e) => setAccountInput({ ...accountInput, balance: e.target.value })}
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <button onClick={addAccount} className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-3">
            Add Account
          </button>



          {/* list of added accounts with remove buttons */}
          {data.bankAccounts.map((acc, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
              <span>{acc.name}: £{acc.balance}</span>
              <button onClick={() => removeAccount(i)} className="text-red-500 text-xs">Remove</button>
            </div>
          ))}
        </section>




        <section className="mb-6">

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Pots</h2>

          <div className="flex gap-2 mb-2">

            <input
              type="text"
              placeholder="Pot name"
              maxLength={30}
              value={potInput.name}
              onChange={(e) => setPotInput({ ...potInput, name: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Balance (£)"
              min="0"
              step="0.01"
              value={potInput.balance}
              onChange={(e) => setPotInput({ ...potInput, balance: e.target.value })}
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <button onClick={addPot} className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-3">
            Add Pot
          </button>



          {/* list of added pots with remove buttons */}
          {data.pots.map((pot, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
              <span>{pot.name}: £{pot.balance}</span>
              <button onClick={() => removePot(i)} className="text-red-500 text-xs">Remove</button>
            </div>
          ))}

        </section>



        <button
          onClick={() => router.push("/onboarding/4.costs")}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full"
        >
          Next
        </button>

      </div>
    </div>
  );
}

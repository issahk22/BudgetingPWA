"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Envelopes() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [input, setInput] = useState({ name: "", amount: "" });


  function addEnvelope() {
    if (!input.name) return;
    update({ envelopes: [...data.envelopes, input] });
    setInput({ name: "", amount: "" });
  }

  function removeEnvelope(i) {
    update({ envelopes: data.envelopes.filter((_, idx) => idx !== i) });
  }




  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1
         className="text-2xl font-semibold text-gray-800 mb-6">
        Envelopes
          </h1>


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
            <span>{env.name} — £{env.amount}</span>
            <button onClick={() => removeEnvelope(i)} className="text-red-500 text-xs">Remove</button>
          </div>
        ))}

        <button
          onClick={() => router.push("/dashboard")}

          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full mt-6"
        >
          Finish
        </button>

      </div>
    </div>
  );
}

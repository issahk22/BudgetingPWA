"use client";

import { useRouter } from "next/navigation";

export default function Accounts() {
  const router = useRouter();

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
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Balance (£)"
              min="0"
              step="0.01"
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full">
            Add Account
          </button>
        </section>

        <section className="mb-6">

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Pots</h2>

          <div className="flex gap-2 mb-2">

            <input
              type="text"
              placeholder="Pot name"
              maxLength={30}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Balance (£)"
              min="0"
              step="0.01"
              className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full">
            Add Pot
          </button>

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

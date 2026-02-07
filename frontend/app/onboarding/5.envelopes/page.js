"use client";

import { useRouter } from "next/navigation";

export default function Envelopes() {
  const router = useRouter();

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

            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="£"
            min="0"
            step="0.01"

            className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 w-full mb-6">
          Add Envelope
        </button>

        <button
          onClick={() => router.push("/dashboard")}

          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full"
        >
          Finish
        </button>

      </div>
    </div>
  );
}

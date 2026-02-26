"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Username() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg">

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Username
        </h1>

        <input
          type="text"
          placeholder="Enter a username"
          maxLength={25}
          value={data.username}
          onChange={(e) => update({ username: e.target.value })}

          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
        />

        <button
          onClick={() => router.push("/onboarding/2.employment")}

          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full"
        >
          Next
        </button>

      </div>
    </div>
  );
}

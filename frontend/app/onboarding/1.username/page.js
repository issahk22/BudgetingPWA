"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Username() {
  const router = useRouter();

  // tracks what the user types in the input
  const [username, setUsername] = useState("");

  // called when next button is clicked username posted to backend
  async function handleNext() {
    const res = await fetch("http://localhost:8000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    // console log for testing
    console.log("Created user:", data);

    router.push("/onboarding/2.employment-goals");
  }

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
          value={username}
          onChange={(e) => setUsername(e.target.value)}

          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
        />

        <button
          onClick={handleNext}

          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 w-full"
        >
          Next
        </button>

      </div>
    </div>
  );
}

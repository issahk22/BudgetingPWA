"use client";

import { useRouter } from "next/navigation";

export default function Costs() {
  const router = useRouter();

  return (
    <div>
      <h1>Fixed Monthly Costs</h1>

      <input type="text" placeholder="Cost name" maxLength={30} />

      <input type="number" placeholder="Amount (£)" min="0" step="0.01" />

      <label>
        <input type="checkbox" />
        Already paid this month
      </label>

      <button>Add Cost</button>

      <button onClick={() => router.push("/onboarding/5.envelopes")}>
        Next
      </button>
    </div>
  );
}

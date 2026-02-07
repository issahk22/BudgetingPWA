"use client";
import { useRouter } from "next/navigation";


export default function EmploymentGoals() {
  const router = useRouter();

  return (
    <div>
      <h1>Employment / Goals</h1>

      <label>
        Hourly Rate (£)
        <input
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </label>

      <label>
        Savings Goal (£)
        <input
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </label>

      <label>
        Deadline
        <input
          type="date"
        />
      </label>

      <button onClick={() => router.push("/onboarding/3.accounts")}>
        Next
      </button>
    </div>
  );
}

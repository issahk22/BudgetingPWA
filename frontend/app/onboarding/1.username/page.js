"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Username() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <div className="ob-card">

        <h1 className="text-2xl font-semibold mb-6">
          Username
        </h1>

        <input
          type="text"
          placeholder="Enter a username"
          maxLength={25}
          value={data.username}
          onChange={(e) => update({ username: e.target.value })}

          className="w-full rounded px-3 py-2 text-sm mb-6"
        />

        <button
          onClick={() => router.push("/onboarding/2.employment")}

          className="btn-primary w-full"
        >
          Next
        </button>

    </div>
  );
}

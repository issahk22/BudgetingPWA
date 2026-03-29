"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../OnboardingContext";

export default function Username() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  function handleNext() {
    if (!data.username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (data.pin.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }
    if (data.pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    router.push("/onboarding/2.employment");
  }

  return (
    <div className="ob-card">
      <h1 className="text-2xl font-semibold mb-6">Username</h1>

      <input
        type="text"
        placeholder="Enter a username"
        maxLength={25}
        value={data.username}
        onChange={(e) => { update({ username: e.target.value }); setError(""); }}
        className="w-full rounded px-3 py-2 text-sm mb-4"
      />

      <input
        type="password"
        inputMode="numeric"
        placeholder="Enter a 4-digit PIN"
        maxLength={4}
        value={data.pin}
        onChange={(e) => { update({ pin: e.target.value.replace(/\D/g, "") }); setError(""); }}
        className="w-full rounded px-3 py-2 text-sm mb-4"
      />

      <input
        type="password"
        inputMode="numeric"
        placeholder="Confirm PIN"
        maxLength={4}
        value={confirmPin}
        onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setError(""); }}
        className="w-full rounded px-3 py-2 text-sm mb-4"
      />

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <button onClick={handleNext} className="btn-primary w-full">
        Next
      </button>
    </div>
  );
}

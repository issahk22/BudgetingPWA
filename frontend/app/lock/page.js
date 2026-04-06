"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

export default function LockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch(`${API}/users/me`)
      .then((r) => r.json())
      .then((d) => { if (d.username) setUsername(d.username); })
      .catch(() => {});
  }, []);


  //sends the pin to backend for verification 
  async function handleUnlock() {
    const res = await fetch(`${API}/auth/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();

    if (data.valid) {
      sessionStorage.setItem("unlocked", "true");
      router.push("/dashboard");
    } else {
      setError("Incorrect PIN.");
      setPin("");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="ob-card w-72 text-center">
        {username && (
          <p className="text-muted text-sm mb-1">Welcome back, {username}</p>
        )}
        <h1 className="text-2xl font-semibold mb-2">Enter PIN</h1>

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          className="w-full rounded px-3 py-2 text-sm text-center tracking-widest mb-3"
          autoFocus
        />

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={handleUnlock} className="btn-primary w-full">
          Unlock
        </button>
      </div>
    </div>
  );
}

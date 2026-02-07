"use client";
import { useRouter } from "next/navigation";


export default function Username() {
  const router = useRouter();

  return (
    <div>
      <h1>Username</h1>

      <input
        type="text"
        placeholder="Enter a username"
        maxLength={25}
      />

      <button onClick={() => router.push("/onboarding/2.employment-goals")}>
        Next
      </button>
    </div>
  );
}

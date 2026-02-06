"use client";
import { useRouter } from "next/navigation";


export default function Accounts() {
  const router = useRouter();

  return (
    <div>
      <h1>Bank Accounts / Pots</h1>
      <button onClick={() => router.push("/onboarding/4.costs")}>
        Next
      </button>
    </div>
  );
}

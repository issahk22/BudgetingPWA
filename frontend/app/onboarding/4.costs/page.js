"use client";
import { useRouter } from "next/navigation";


export default function Costs() {
  const router = useRouter();

  return (
    <div>
      <h1>Fixed Monthly Costs</h1>
      <button onClick={() => router.push("/onboarding/5.envelopes")}>
        Next
      </button>
    </div>
  );
}

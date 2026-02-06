"use client";
import { useRouter } from "next/navigation";


export default function Employment() {
  const router = useRouter();

  return (
    <div>
      <h1>Employment Details</h1>
      <button onClick={() => router.push("/onboarding/3.accounts")}>
        Next
      </button>
    </div>
  );
}

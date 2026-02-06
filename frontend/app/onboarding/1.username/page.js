"use client";
import { useRouter } from "next/navigation";


export default function Username() {
  const router = useRouter();

  return (
    <div>
      <h1>Username</h1>
      <button onClick={() => router.push("/onboarding/2.employment")}>
        Next
      </button>
    </div>
  );
}

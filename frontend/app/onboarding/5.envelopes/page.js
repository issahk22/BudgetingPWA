"use client";
import { useRouter } from "next/navigation";


export default function Envelopes() {
  const router = useRouter();

  return (
    <div>
      <h1>Envelopes</h1>
      <button onClick={() => router.push("/dashboard")}>
        Finish
      </button>
    </div>
  );
}

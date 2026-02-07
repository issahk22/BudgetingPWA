"use client";

import { useRouter } from "next/navigation";

export default function Envelopes() {
  const router = useRouter();

  return (

    <div>
      <h1>Envelopes</h1>


      <input type="text" placeholder="Envelope name" maxLength={30} />
      <input type="number" placeholder="£" min="0" step="0.01" />
      <button>Add Envelope</button>


      <button onClick={() => router.push("/dashboard")}>
        Finish
      </button>
    </div>
  );
}

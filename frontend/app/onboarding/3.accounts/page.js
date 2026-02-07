"use client";

import { useRouter } from "next/navigation";

export default function Accounts() {
  const router = useRouter();

  return (
    <div>


      <h1>Bank Accounts / Pots</h1>

      <section>

        <h2>Current Accounts</h2>
        <input type="text" placeholder="Account name" maxLength={30} />
        <input type="number" placeholder="Balance (£)" min="0" step="0.01" />
        <button>Add Account</button>

      </section>



      <section>
        <h2>Pots</h2>
        <input type="text" placeholder="Pot name" maxLength={30} />
        <input type="number" placeholder="Balance (£)" min="0" step="0.01" />
        <button>Add Pot</button>
      </section>

      <button onClick={() => router.push("/onboarding/4.costs")}>
        Next
      </button>

    </div>
  );
}

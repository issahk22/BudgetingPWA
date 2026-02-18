"use client";

import { useState, useEffect } from "react";

const API = "http://localhost:8000";


export default function Dashboard() {


  const [bankAccounts, setBankAccounts] = useState([]);
  const [pots, setPots] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);

  // Loading added in case of API delays so user does not see incorrect info
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    async function fetchData() {

      try {
        // Runs all requests simultaneously
        const [accountsRes, potsRes, envelopesRes, fixedCostsRes] = await Promise.all([
          fetch(`${API}/bank-accounts`),
          fetch(`${API}/pots`),
          fetch(`${API}/envelopes`),
          fetch(`${API}/fixed-costs`),
        ]);

        const accountsData = await accountsRes.json();
        const potsData = await potsRes.json();
        const envelopesData = await envelopesRes.json();
        const fixedCostsData = await fixedCostsRes.json();

        setBankAccounts(accountsData);
        setPots(potsData);
        setEnvelopes(envelopesData);
        setFixedCosts(fixedCostsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false); // Ensures page never gets stuck on loading screen
      }
    }

    fetchData();
  }, []);



  const totalBalance = bankAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0
  );


  async function handlePaidToggle(cost) {
    const newPaid = !cost.paid;
    const amount = parseFloat(cost.amount);

    // Update fixed cost "paid?" status
    await fetch(`${API}/fixed-costs/${cost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });


    //adjust the first bank account balance accordingly. WILL NEED TO BE CHANGED LATER. 

    if (bankAccounts.length > 0) {
      const account = bankAccounts[0];
      const currentBalance = parseFloat(account.balance);
      //maths logic. if user marks as paid, amount will be deducted from bank account
      const newBalance = newPaid
        ? currentBalance - amount
        : currentBalance + amount;

      await fetch(`${API}/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance }),
      });



      setBankAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id ? { ...acc, balance: newBalance } : acc
        )
      );
    }


    setFixedCosts((prev) =>
      prev.map((c) => (c.id === cost.id ? { ...c, paid: newPaid } : c))
    );


  
  }


  if (loading) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }



  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: "40px", marginTop: "20px", flexWrap: "wrap" }}>

        {/* Bank Accounts */}

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Bank Accounts</h2>
          <p>Total: £{totalBalance.toFixed(2)}</p>

          {bankAccounts.length === 0 ? (
            <p>No accounts found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {bankAccounts.map((acc, i) => (
                <li key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>{acc.account_name}</span>
                  <span>£{parseFloat(acc.balance).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>


        {/* Pots */}

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Pots</h2>

          {pots.length === 0 ? (
            <p>No pots found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {pots.map((pot) => (
                <li key={pot.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>{pot.pot_name}</span>
                  <span>£{parseFloat(pot.balance).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>



        {/* Envelopes */}

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Envelopes</h2>

          {envelopes.length === 0 ? (
            <p>No envelopes found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {envelopes.map((env) => (
                <li key={env.id} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{env.envelope_name}</span>
                    <span>£{parseFloat(env.balance).toFixed(2)} / £{parseFloat(env.allocated_amount).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>




        {/* Monthly Fixed Costs */}

        <div style={{ border: "1px solid #ccc", padding: "16px", minWidth: "200px" }}>
          <h2>Monthly Costs</h2>

          {fixedCosts.length === 0 ? (
            <p>No fixed costs found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {fixedCosts.map((cost) => (
                <li key={cost.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "16px" }}>
                  <span>{cost.cost_name}</span>
                  <span>£{parseFloat(cost.amount).toFixed(2)}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={cost.paid}
                      onChange={() => handlePaidToggle(cost)}
                    />
                    Paid?
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

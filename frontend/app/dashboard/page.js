"use client";

import { useState, useEffect } from "react";

const API = "http://localhost:8000";


export default function Dashboard() {


  const [bankAccounts, setBankAccounts] = useState([]);
  const [pots, setPots] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  // Loading added in case of API delays so user does not see incorrect info
  const [loading, setLoading] = useState(true);



  useEffect(() => {

    async function fetchData() {

      try {
        // Runs all requests simultaneously
        const [accountsRes, potsRes, envelopesRes] = await Promise.all([
          fetch(`${API}/bank-accounts`),
          fetch(`${API}/pots`),
          fetch(`${API}/envelopes`),
        ]);

        const accountsData = await accountsRes.json();
        const potsData = await potsRes.json();
        const envelopesData = await envelopesRes.json();

        setBankAccounts(accountsData);
        setPots(potsData);
        setEnvelopes(envelopesData);
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

      <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>

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

      </div>
    </div>
  );
}

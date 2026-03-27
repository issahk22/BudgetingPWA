"use client";

import { createContext, useContext, useState } from "react";


const OnboardingContext = createContext(null);

//stores data temporarily in frontend before database is created


export function OnboardingProvider({ children }) {
  const [data, setData] = useState({
    username: "",
    accounts: [],
    fixedCosts: [],
    envelopes: [],
    jobs: [],
    shiftTypes: ["regular", "overtime", "night"],
  });


//ensures data is kept when user is modifying a field.
  function update(fields) {
    setData(prev => ({ ...prev, ...fields }));
  }

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}

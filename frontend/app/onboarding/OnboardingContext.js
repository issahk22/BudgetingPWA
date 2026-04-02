"use client";

import { createContext, useContext, useState } from "react";


const OnboardingContext = createContext(null);

//stores data temporarily in frontend before database is created


export function OnboardingProvider({ children }) {
  const [data, setData] = useState({
    username: "",
    pin: "",
    accounts: [],
    fixedCosts: [],
    envelopes: [],
    jobs: [],
    shiftTypes: [
      { type_name: "regular", rate_multiplier: "1.000" },
      { type_name: "night", rate_multiplier: "1.500" },
    ],
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

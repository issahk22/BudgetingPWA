"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // fetch onboarding complete status 
    async function checkOnboarding() {
      const res = await fetch("http://localhost:8000/onboarding-status");
      const data = await res.json();

      if (data.completed) {
        if (data.pin_set && sessionStorage.getItem("unlocked") !== "true") {
          router.push("/lock");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/onboarding/1.username");
      }
    }

    checkOnboarding();
  }, []);

  return null;
}

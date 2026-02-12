import { OnboardingProvider } from "./OnboardingContext";

export default function OnboardingLayout({ children }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

//added for nextjs hierachy, wraps all onboarding together
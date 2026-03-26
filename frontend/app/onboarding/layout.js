import { OnboardingProvider } from "./OnboardingContext";
import "./onboarding.css";

export default function OnboardingLayout({ children }) {
  return (
    <OnboardingProvider>
      <div className="ob-page">
        {children}
      </div>
    </OnboardingProvider>
  );
}

//added for nextjs hierachy, wraps all onboarding together

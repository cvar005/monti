import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/data";
import OnboardingFlow from "./OnboardingFlow";

export default async function OnboardingPage() {
  const { profile } = await requireProfile(true);
  if (profile.onboarded) redirect("/");
  return <OnboardingFlow initialName={profile.name} />;
}

import { useStore } from "@/store/useStore";
import { Redirect } from "expo-router";

export default function Index() {
  const { isOnboarded } = useStore();

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

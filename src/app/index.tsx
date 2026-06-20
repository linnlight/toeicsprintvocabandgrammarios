import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useApp } from '@/state/app-provider';

export default function IndexScreen() {
  const { hydrated, data } = useApp();
  if (!hydrated) return <LoadingScreen />;
  return <Redirect href={data.settings.onboardingComplete ? '/home' : '/onboarding'} />;
}

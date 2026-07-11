import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { AppProvider } from '@/state/app-provider';
import { PurchaseProvider } from '@/state/purchase-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PurchaseProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
            <Stack.Screen name="home" options={{ animation: 'none' }} />
            <Stack.Screen name="tests" options={{ animation: 'none' }} />
            <Stack.Screen name="grammar" options={{ animation: 'none' }} />
            <Stack.Screen name="review" options={{ animation: 'none' }} />
            <Stack.Screen name="progress" options={{ animation: 'none' }} />
          </Stack>
        </AppProvider>
      </PurchaseProvider>
    </SafeAreaProvider>
  );
}

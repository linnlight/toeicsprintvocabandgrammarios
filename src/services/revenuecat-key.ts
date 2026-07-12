export type RevenueCatPlatform = 'ios' | 'android';

/**
 * RevenueCat SDK keys are public, platform-specific keys. Secret keys must
 * never be bundled into a client app, even if they are supplied through an
 * EXPO_PUBLIC_* environment variable.
 */
export function normalizePublicRevenueCatKey(
  platform: RevenueCatPlatform,
  value: string | undefined,
): string | undefined {
  const key = value?.trim();
  if (!key || key.length > 200) return undefined;

  const validPrefixes = platform === 'ios' ? ['appl_', 'test_'] : ['goog_', 'test_'];
  return validPrefixes.some((prefix) => key.startsWith(prefix)) ? key : undefined;
}

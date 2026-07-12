import { describe, expect, it } from 'vitest';

import { normalizePublicRevenueCatKey } from './revenuecat-key';

describe('normalizePublicRevenueCatKey', () => {
  it('accepts the correct public key for each platform', () => {
    expect(normalizePublicRevenueCatKey('ios', 'appl_example')).toBe('appl_example');
    expect(normalizePublicRevenueCatKey('android', 'goog_example')).toBe('goog_example');
    expect(normalizePublicRevenueCatKey('ios', 'test_example')).toBe('test_example');
  });

  it('rejects secret, wrong-platform, empty, and oversized values', () => {
    expect(normalizePublicRevenueCatKey('ios', 'sk_secret')).toBeUndefined();
    expect(normalizePublicRevenueCatKey('ios', 'goog_example')).toBeUndefined();
    expect(normalizePublicRevenueCatKey('android', 'appl_example')).toBeUndefined();
    expect(normalizePublicRevenueCatKey('ios', '   ')).toBeUndefined();
    expect(normalizePublicRevenueCatKey('ios', `appl_${'x'.repeat(200)}`)).toBeUndefined();
  });
});

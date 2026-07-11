import Purchases, { LOG_LEVEL, type CustomerInfo, type CustomerInfoUpdateListener } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { Platform } from 'react-native';

import {
  PRO_ENTITLEMENT_ID,
  type PurchaseInitialization,
  type PurchaseStatus,
  type PurchaseStatusListener,
  unavailablePurchaseStatus,
} from './purchases.types';

let configuredInThisProcess = false;

function platformApiKey(): string | undefined {
  const key = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  return key?.trim() || undefined;
}

function statusFromCustomerInfo(customerInfo: CustomerInfo): PurchaseStatus {
  const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
  return {
    configured: true,
    isPro: Boolean(entitlement?.isActive),
    expirationDate: entitlement?.expirationDate ?? null,
    productIdentifier: entitlement?.productIdentifier ?? null,
  };
}

async function ensureConfigured(): Promise<boolean> {
  if (configuredInThisProcess || await Purchases.isConfigured().catch(() => false)) {
    configuredInThisProcess = true;
    return true;
  }

  const apiKey = platformApiKey();
  if (!apiKey) return false;

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configuredInThisProcess = true;
  return true;
}

async function configuredCustomerStatus(): Promise<PurchaseStatus> {
  if (!await ensureConfigured()) return unavailablePurchaseStatus;
  return statusFromCustomerInfo(await Purchases.getCustomerInfo());
}

export async function initializePurchases(
  listener: PurchaseStatusListener,
): Promise<PurchaseInitialization> {
  if (!await ensureConfigured()) {
    return { status: unavailablePurchaseStatus, removeListener: () => undefined };
  }

  const customerInfoListener: CustomerInfoUpdateListener = (customerInfo) => {
    listener(statusFromCustomerInfo(customerInfo));
  };
  Purchases.addCustomerInfoUpdateListener(customerInfoListener);

  return {
    status: await configuredCustomerStatus(),
    removeListener: () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    },
  };
}

export async function presentProPaywall(): Promise<PurchaseStatus> {
  if (!await ensureConfigured()) throw new Error('PURCHASES_NOT_CONFIGURED');
  await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    displayCloseButton: true,
  });
  return configuredCustomerStatus();
}

export async function manageProPurchases(): Promise<void> {
  if (!await ensureConfigured()) throw new Error('PURCHASES_NOT_CONFIGURED');
  await RevenueCatUI.presentCustomerCenter();
}

export async function restoreProPurchases(): Promise<PurchaseStatus> {
  if (!await ensureConfigured()) throw new Error('PURCHASES_NOT_CONFIGURED');
  return statusFromCustomerInfo(await Purchases.restorePurchases());
}

export async function redeemPromotionCode(): Promise<void> {
  if (!await ensureConfigured()) throw new Error('PURCHASES_NOT_CONFIGURED');
  if (Platform.OS !== 'ios') throw new Error('OFFER_CODES_IOS_ONLY');
  await Purchases.presentCodeRedemptionSheet();
}

export async function refreshPurchaseStatus(): Promise<PurchaseStatus> {
  return configuredCustomerStatus();
}

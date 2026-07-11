import {
  type PurchaseInitialization,
  type PurchaseStatus,
  type PurchaseStatusListener,
  unavailablePurchaseStatus,
} from './purchases.types';

// Web billing is intentionally separate from the iOS MVP. Metro replaces this
// file with purchases.native.ts in native builds.
export async function initializePurchases(
  _listener: PurchaseStatusListener,
): Promise<PurchaseInitialization> {
  return { status: unavailablePurchaseStatus, removeListener: () => undefined };
}

export async function presentProPaywall(): Promise<PurchaseStatus> {
  throw new Error('PURCHASES_UNAVAILABLE');
}

export async function manageProPurchases(): Promise<void> {
  throw new Error('PURCHASES_UNAVAILABLE');
}

export async function restoreProPurchases(): Promise<PurchaseStatus> {
  throw new Error('PURCHASES_UNAVAILABLE');
}

export async function redeemPromotionCode(): Promise<void> {
  throw new Error('PURCHASES_UNAVAILABLE');
}

export async function refreshPurchaseStatus(): Promise<PurchaseStatus> {
  return unavailablePurchaseStatus;
}

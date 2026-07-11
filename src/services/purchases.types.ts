// RevenueCat entitlement identifiers are case-sensitive. Keep this value in
// sync with Product catalog > Entitlements in the RevenueCat dashboard.
export const PRO_ENTITLEMENT_ID = 'TOEIC Sprint Vocab & Grammar Pro';

export interface PurchaseStatus {
  configured: boolean;
  isPro: boolean;
  expirationDate: string | null;
  productIdentifier: string | null;
}

export interface PurchaseInitialization {
  status: PurchaseStatus;
  removeListener: () => void;
}

export const unavailablePurchaseStatus: PurchaseStatus = {
  configured: false,
  isPro: false,
  expirationDate: null,
  productIdentifier: null,
};

export type PurchaseStatusListener = (status: PurchaseStatus) => void;

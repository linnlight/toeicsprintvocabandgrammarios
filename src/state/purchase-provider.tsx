import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  initializePurchases,
  manageProPurchases,
  presentProPaywall,
  redeemPromotionCode,
  refreshPurchaseStatus,
  restoreProPurchases,
} from '@/services/purchases';
import { type PurchaseStatus, unavailablePurchaseStatus } from '@/services/purchases.types';

interface PurchaseContextValue extends PurchaseStatus {
  ready: boolean;
  busy: boolean;
  error: boolean;
  clearError: () => void;
  manage: () => Promise<boolean>;
  presentPaywall: () => Promise<boolean>;
  redeemCode: () => Promise<boolean>;
  refresh: () => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<PurchaseStatus>(unavailablePurchaseStatus);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let removeListener: () => void = () => undefined;

    initializePurchases((nextStatus) => {
      if (active) setStatus(nextStatus);
    })
      .then((initialization) => {
        removeListener = initialization.removeListener;
        if (active) {
          setStatus(initialization.status);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setReady(true);
        }
      });

    return () => {
      active = false;
      removeListener();
    };
  }, []);

  const runStatusAction = useCallback(async (action: () => Promise<PurchaseStatus>) => {
    setBusy(true);
    setError(false);
    try {
      setStatus(await action());
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const presentPaywall = useCallback(() => runStatusAction(presentProPaywall), [runStatusAction]);
  const restore = useCallback(() => runStatusAction(restoreProPurchases), [runStatusAction]);
  const refresh = useCallback(() => runStatusAction(refreshPurchaseStatus), [runStatusAction]);
  const redeemCode = useCallback(async () => {
    setBusy(true);
    setError(false);
    try {
      await redeemPromotionCode();
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  const clearError = useCallback(() => setError(false), []);
  const manage = useCallback(async () => {
    setBusy(true);
    setError(false);
    try {
      await manageProPurchases();
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<PurchaseContextValue>(() => ({
    ...status,
    ready,
    busy,
    error,
    clearError,
    manage,
    presentPaywall,
    redeemCode,
    refresh,
    restore,
  }), [status, ready, busy, error, clearError, manage, presentPaywall, redeemCode, refresh, restore]);

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (!context) throw new Error('usePurchases must be used within PurchaseProvider');
  return context;
}

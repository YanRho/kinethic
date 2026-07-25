"use client";

import { useMemo, useSyncExternalStore } from "react";
import { repository } from "./repository";
import { KinEthicData } from "./domain";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function useKinEthicData(): KinEthicData {
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getServerSnapshot,
  );
  return useMemo(() => JSON.parse(snapshot) as KinEthicData, [snapshot]);
}

export function useKinEthicHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
}

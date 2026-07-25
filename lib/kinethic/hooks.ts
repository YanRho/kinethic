"use client";

import { useMemo, useSyncExternalStore } from "react";
import { repository } from "./repository";
import { KinEthicData } from "./domain";

export function useKinEthicData(): KinEthicData {
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getServerSnapshot,
  );
  return useMemo(() => JSON.parse(snapshot) as KinEthicData, [snapshot]);
}

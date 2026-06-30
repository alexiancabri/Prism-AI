import { useSyncExternalStore } from "react";
import { getPrefs, subscribePrefs } from "@/lib/prefs";

/** Reactively read the shared preferences store. */
export function usePrefs() {
  return useSyncExternalStore(subscribePrefs, getPrefs, getPrefs);
}

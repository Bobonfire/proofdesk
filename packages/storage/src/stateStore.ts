import type { RuntimeState } from "@proofdesk/domain";

const STORAGE_KEY = "proofdesk.runtime.v1";

export function loadRuntimeState(): RuntimeState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as RuntimeState;
  } catch {
    return null;
  }
}

export function saveRuntimeState(state: RuntimeState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearRuntimeState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

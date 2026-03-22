import { createInitialRuntimeState, type FunctionItem, type RuntimeState, type TestCase } from "@proofdesk/domain";

const STORAGE_KEY = "proofdesk.runtime.v1";

function isArrayOfObjects(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

function sanitizeFunctions(value: unknown, fallback: FunctionItem[]): FunctionItem[] {
  if (!isArrayOfObjects(value)) {
    return fallback;
  }

  const hasValidShape = value.every(
    (item) =>
      typeof item.id === "string" &&
      typeof item.epicId === "string" &&
      typeof item.featureId === "string" &&
      typeof item.name === "string" &&
      typeof item.shortDescription === "string" &&
      typeof item.expectedBehavior === "string"
  );
  if (!hasValidShape) {
    return fallback;
  }

  return value as unknown as FunctionItem[];
}

function sanitizeTestCases(value: unknown, fallback: TestCase[]): TestCase[] {
  if (!isArrayOfObjects(value)) {
    return fallback;
  }

  const hasValidShape = value.every(
    (item) =>
      typeof item.id === "string" &&
      typeof item.functionId === "string" &&
      typeof item.name === "string" &&
      typeof item.description === "string" &&
      typeof item.testType === "string" &&
      typeof item.executionType === "string"
  );
  if (!hasValidShape) {
    return fallback;
  }

  return value as unknown as TestCase[];
}

export function loadRuntimeState(): RuntimeState {
  const fallback = createInitialRuntimeState();
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return fallback;
    }

    const parsed = JSON.parse(value) as Partial<RuntimeState>;
    return {
      approvedForRelease: Boolean(parsed.approvedForRelease),
      functions: sanitizeFunctions(parsed.functions, fallback.functions),
      testCases: sanitizeTestCases(parsed.testCases, fallback.testCases),
      runHistory: Array.isArray(parsed.runHistory) ? parsed.runHistory : []
    };
  } catch {
    return fallback;
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

import type { AcceptanceStatus, DevStatus, FunctionItem, ReleaseState, RuntimeState, TestStatus } from "@proofdesk/domain";

const SCHEMA_VERSION = "1.0.0";
const SOURCE = "proofdesk-ui";

const DEV_STATUSES: DevStatus[] = ["not_started", "in_progress", "built", "partial", "blocked"];
const TEST_STATUSES: TestStatus[] = ["not_tested", "ready_to_test", "passed", "failed"];
const ACCEPTANCE_STATUSES: AcceptanceStatus[] = ["in_scope", "under_review", "accepted", "rejected"];

const DEV_TRANSITIONS: Record<DevStatus, DevStatus[]> = {
  not_started: ["not_started", "in_progress"],
  in_progress: ["in_progress", "built", "partial", "blocked"],
  built: ["built"],
  partial: ["partial", "in_progress", "built", "blocked"],
  blocked: ["blocked", "in_progress", "partial", "built"]
};

const TEST_TRANSITIONS: Record<TestStatus, TestStatus[]> = {
  not_tested: ["not_tested", "ready_to_test"],
  ready_to_test: ["ready_to_test", "passed", "failed"],
  passed: ["passed", "ready_to_test", "failed"],
  failed: ["failed", "ready_to_test", "passed"]
};

const ACCEPTANCE_TRANSITIONS: Record<AcceptanceStatus, AcceptanceStatus[]> = {
  in_scope: ["in_scope", "under_review"],
  under_review: ["under_review", "accepted", "rejected"],
  accepted: ["accepted"],
  rejected: ["rejected"]
};

interface ProofdeskFile {
  text(): Promise<string>;
}

interface ProofdeskWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface ProofdeskFileHandle {
  getFile(): Promise<ProofdeskFile>;
  createWritable(): Promise<ProofdeskWritable>;
}

export interface ProofdeskDirectoryHandle {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<ProofdeskDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<ProofdeskFileHandle>;
}

type EventActor = "user" | "agent" | "system";

interface ProjectConfig {
  schema_version: string;
  project_id: string;
  project_name: string;
  repo_root: string;
  default_branch: string;
  created_at: string;
  status_enums: {
    devStatus: DevStatus[];
    testStatus: TestStatus[];
    acceptanceStatus: AcceptanceStatus[];
    readyForCommit: Array<"NOT_READY" | "ALMOST_READY" | "READY">;
  };
}

interface StateFunctionRecord {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  devStatus: DevStatus;
  testStatus: TestStatus;
  acceptanceStatus: AcceptanceStatus;
  quality_flags?: {
    needs_refactor?: boolean;
    needs_clarification?: boolean;
  };
  notes?: string;
  last_updated_at: string;
}

interface StateFile {
  schema_version: string;
  generated_at: string;
  source: "proofdesk-ui" | "proofdesk-agent";
  current_snapshot: string;
  approved_for_release: boolean;
  release_state: {
    ready_for_commit: "NOT_READY" | "ALMOST_READY" | "READY";
    total_functions: number;
    required_functions: number;
    accepted_functions: number;
    blocking_functions: number;
    readiness_reason: string;
  };
  functions: StateFunctionRecord[];
  supersedes_snapshot: string | null;
}

interface ManifestItem {
  type: "snapshot" | "event" | "update";
  file: string;
  sha256: string;
  created_at: string;
  supersedes?: string | null;
}

interface ManifestFile {
  schema_version: string;
  project_id: string;
  generated_at: string;
  latest_snapshot: string;
  latest_event_seq: number;
  latest_update_seq: number;
  items: ManifestItem[];
}

interface EventFile {
  schema_version: string;
  event_id: string;
  seq: number;
  created_at: string;
  type: "status_change" | "test_execution" | "approval_trigger" | "release_readiness_computed" | "manual_note";
  actor: EventActor;
  function_id: string | null;
  payload: Record<string, unknown>;
  snapshot_ref: string | null;
  supersedes: string | null;
}

interface DirectoryLayout {
  rootDir: ProofdeskDirectoryHandle;
  configDir: ProofdeskDirectoryHandle;
  stateDir: ProofdeskDirectoryHandle;
  snapshotsDir: ProofdeskDirectoryHandle;
  eventsDir: ProofdeskDirectoryHandle;
  updatesDir: ProofdeskDirectoryHandle;
  indexDir: ProofdeskDirectoryHandle;
}

export interface PersistProofdeskContractInput {
  repositoryHandle: ProofdeskDirectoryHandle;
  runtimeState: RuntimeState;
  releaseState: ReleaseState;
  actor?: EventActor;
  summary?: string;
  changedFiles?: string[];
}

export interface PersistProofdeskContractResult {
  rootPath: "proofdesk";
  snapshotFile: string;
  eventFile: string;
  updateFile: string;
  currentFile: string;
  manifestFile: string;
  eventSeq: number;
  updateSeq: number;
}

function toCompactUtcTimestamp(dateIso: string): string {
  const date = new Date(dateIso);
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hour = date.getUTCHours().toString().padStart(2, "0");
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  const second = date.getUTCSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function padSeq(sequence: number): string {
  return sequence.toString().padStart(4, "0");
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => (value % 16).toString(16))
    .join("")
    .slice(0, length);
}

async function sha256Hex(content: string): Promise<string> {
  const encoded = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, 40);
}

function sanitizeProjectId(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

  if (sanitized.length >= 3) {
    return sanitized;
  }

  return "proofdesk_project";
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && (error as { name: string }).name === "NotFoundError";
}

async function readTextFile(directory: ProofdeskDirectoryHandle, filename: string): Promise<string | null> {
  try {
    const fileHandle = await directory.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function writeTextFile(directory: ProofdeskDirectoryHandle, filename: string, content: string): Promise<void> {
  const fileHandle = await directory.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function readJsonFile<T>(directory: ProofdeskDirectoryHandle, filename: string): Promise<T | null> {
  const text = await readTextFile(directory, filename);
  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

async function resolveLayout(repositoryHandle: ProofdeskDirectoryHandle): Promise<DirectoryLayout> {
  const rootDir =
    repositoryHandle.name === "proofdesk"
      ? repositoryHandle
      : await repositoryHandle.getDirectoryHandle("proofdesk", { create: true });

  const configDir = await rootDir.getDirectoryHandle("config", { create: true });
  const stateDir = await rootDir.getDirectoryHandle("state", { create: true });
  const snapshotsDir = await stateDir.getDirectoryHandle("snapshots", { create: true });
  const eventsDir = await rootDir.getDirectoryHandle("events", { create: true });
  const updatesDir = await rootDir.getDirectoryHandle("updates", { create: true });
  const indexDir = await rootDir.getDirectoryHandle("index", { create: true });

  return {
    rootDir,
    configDir,
    stateDir,
    snapshotsDir,
    eventsDir,
    updatesDir,
    indexDir
  };
}

function createDefaultProjectConfig(repositoryName: string, nowIso: string): ProjectConfig {
  const projectId = sanitizeProjectId(repositoryName);

  return {
    schema_version: SCHEMA_VERSION,
    project_id: projectId,
    project_name: repositoryName || "ProofDesk Project",
    repo_root: ".",
    default_branch: "main",
    created_at: nowIso,
    status_enums: {
      devStatus: [...DEV_STATUSES],
      testStatus: [...TEST_STATUSES],
      acceptanceStatus: [...ACCEPTANCE_STATUSES],
      readyForCommit: ["NOT_READY", "ALMOST_READY", "READY"]
    }
  };
}

function createDefaultManifest(projectId: string, nowIso: string): ManifestFile {
  return {
    schema_version: SCHEMA_VERSION,
    project_id: projectId,
    generated_at: nowIso,
    latest_snapshot: `PD_STATE_${toCompactUtcTimestamp(nowIso)}_${randomHex(7)}.json`,
    latest_event_seq: 0,
    latest_update_seq: 0,
    items: []
  };
}

function assertCanonicalStatuses(functions: FunctionItem[]): void {
  const errors: string[] = [];

  for (const item of functions) {
    if (!DEV_STATUSES.includes(item.devStatus)) {
      errors.push(`Function ${item.id} has invalid devStatus: ${item.devStatus}`);
    }
    if (!TEST_STATUSES.includes(item.testStatus)) {
      errors.push(`Function ${item.id} has invalid testStatus: ${item.testStatus}`);
    }
    if (!ACCEPTANCE_STATUSES.includes(item.acceptanceStatus)) {
      errors.push(`Function ${item.id} has invalid acceptanceStatus: ${item.acceptanceStatus}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Enum validation failed:\n${errors.join("\n")}`);
  }
}

function assertTransitionLegal(previous: StateFunctionRecord[] | undefined, next: FunctionItem[]): void {
  if (!previous || previous.length === 0) {
    return;
  }

  const previousById = new Map(previous.map((item) => [item.id, item]));
  const nextIds = new Set(next.map((item) => item.id));
  const errors: string[] = [];

  for (const current of next) {
    const prior = previousById.get(current.id);
    if (!prior) {
      continue;
    }

    if (!DEV_STATUSES.includes(prior.devStatus)) {
      errors.push(`Function ${current.id} has non-canonical prior devStatus: ${String(prior.devStatus)}`);
      continue;
    }
    if (!TEST_STATUSES.includes(prior.testStatus)) {
      errors.push(`Function ${current.id} has non-canonical prior testStatus: ${String(prior.testStatus)}`);
      continue;
    }
    if (!ACCEPTANCE_STATUSES.includes(prior.acceptanceStatus)) {
      errors.push(
        `Function ${current.id} has non-canonical prior acceptanceStatus: ${String(prior.acceptanceStatus)}`
      );
      continue;
    }

    if (!DEV_TRANSITIONS[prior.devStatus].includes(current.devStatus)) {
      errors.push(`Function ${current.id} devStatus transition ${prior.devStatus} -> ${current.devStatus} is not allowed`);
    }

    if (!TEST_TRANSITIONS[prior.testStatus].includes(current.testStatus)) {
      errors.push(`Function ${current.id} testStatus transition ${prior.testStatus} -> ${current.testStatus} is not allowed`);
    }

    if (!ACCEPTANCE_TRANSITIONS[prior.acceptanceStatus].includes(current.acceptanceStatus)) {
      errors.push(
        `Function ${current.id} acceptanceStatus transition ${prior.acceptanceStatus} -> ${current.acceptanceStatus} is not allowed`
      );
    }
  }

  for (const prior of previous) {
    if (!nextIds.has(prior.id)) {
      errors.push(`Function ${prior.id} was removed from runtime state`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Status transition validation failed:\n${errors.join("\n")}`);
  }
}

function computeBlockingFunctions(functions: FunctionItem[]): number {
  return functions.filter((item) => {
    if (item.priority !== "high") {
      return false;
    }

    const isBuilt = item.devStatus === "built" || item.devStatus === "partial";
    return !(isBuilt && item.testStatus === "passed" && item.acceptanceStatus === "accepted");
  }).length;
}

function assertReleaseStateConsistency(runtimeState: RuntimeState, releaseState: ReleaseState): void {
  const computedBlocking = computeBlockingFunctions(runtimeState.functions);
  if (computedBlocking !== releaseState.blockingFunctions) {
    throw new Error(
      `Release state mismatch: expected blockingFunctions=${computedBlocking}, got ${releaseState.blockingFunctions}`
    );
  }

  if (runtimeState.approvedForRelease && releaseState.blockingFunctions === 0 && releaseState.readyForCommit !== "READY") {
    throw new Error("Release state mismatch: approval is true and no blockers exist, readyForCommit must be READY");
  }

  if (!runtimeState.approvedForRelease && releaseState.readyForCommit === "READY") {
    throw new Error("Release state mismatch: readyForCommit cannot be READY while approvedForRelease is false");
  }
}

function toStateFunctionRecord(item: FunctionItem, nowIso: string): StateFunctionRecord {
  return {
    id: item.id,
    title: item.name,
    priority: item.priority,
    devStatus: item.devStatus,
    testStatus: item.testStatus,
    acceptanceStatus: item.acceptanceStatus,
    quality_flags: {
      needs_refactor: false,
      needs_clarification: false
    },
    notes: item.notes,
    last_updated_at: nowIso
  };
}

function toStateFile(
  runtimeState: RuntimeState,
  releaseState: ReleaseState,
  snapshotFileName: string,
  nowIso: string,
  supersedesSnapshot: string | null
): StateFile {
  return {
    schema_version: SCHEMA_VERSION,
    generated_at: nowIso,
    source: SOURCE,
    current_snapshot: snapshotFileName,
    approved_for_release: runtimeState.approvedForRelease,
    release_state: {
      ready_for_commit: releaseState.readyForCommit,
      total_functions: releaseState.totalFunctions,
      required_functions: releaseState.requiredFunctions,
      accepted_functions: releaseState.acceptedFunctions,
      blocking_functions: releaseState.blockingFunctions,
      readiness_reason: releaseState.readinessReason
    },
    functions: runtimeState.functions.map((item) => toStateFunctionRecord(item, nowIso)),
    supersedes_snapshot: supersedesSnapshot
  };
}

function buildUpdateMarkdown(input: {
  nowIso: string;
  summary: string;
  changedFiles: string[];
  releaseState: ReleaseState;
  runtimeState: RuntimeState;
  snapshotFile: string;
  eventFile: string;
}): string {
  const fileLines = input.changedFiles.length > 0 ? input.changedFiles.map((item) => `- ${item}`).join("\n") : "- None provided";
  const statusLines = [
    `- Total functions: ${input.releaseState.totalFunctions}`,
    `- High-priority required: ${input.releaseState.requiredFunctions}`,
    `- High-priority accepted: ${input.releaseState.acceptedFunctions}`,
    `- Blocking high-priority functions: ${input.releaseState.blockingFunctions}`,
    `- Approved for release: ${input.runtimeState.approvedForRelease ? "true" : "false"}`
  ].join("\n");

  const impact = input.releaseState.readyForCommit === "READY" ? "Commit gate can open." : "Commit gate remains blocked.";
  const risks = input.releaseState.blockingFunctions > 0 ? "High-priority functions still block release readiness." : "No high-priority blockers.";
  const nextActions =
    input.releaseState.readyForCommit === "READY"
      ? "Proceed with release agent validation and commit safety checks."
      : "Resolve blocking functions or collect approval to reach READY state.";

  return [
    `# ProofDesk Update (${input.nowIso})`,
    "",
    "## Summary",
    input.summary,
    "",
    "## Files Changed",
    fileLines,
    "",
    "## Status Changes",
    statusLines,
    "",
    "## Release Impact",
    `${impact} (${input.releaseState.readyForCommit})`,
    "",
    "## Risks",
    risks,
    "",
    "## Next Actions",
    nextActions,
    "",
    "## Artifacts",
    `- Snapshot: ${input.snapshotFile}`,
    `- Event: ${input.eventFile}`,
    ""
  ].join("\n");
}

export async function persistProofdeskContract(input: PersistProofdeskContractInput): Promise<PersistProofdeskContractResult> {
  const nowIso = new Date().toISOString();
  const compactTimestamp = toCompactUtcTimestamp(nowIso);
  const layout = await resolveLayout(input.repositoryHandle);

  let projectConfig = await readJsonFile<ProjectConfig>(layout.configDir, "project.json");
  if (!projectConfig) {
    projectConfig = createDefaultProjectConfig(input.repositoryHandle.name, nowIso);
    await writeTextFile(layout.configDir, "project.json", stableJson(projectConfig));
  }

  const previousCurrent = await readJsonFile<StateFile>(layout.stateDir, "current.json");
  const previousManifest = await readJsonFile<ManifestFile>(layout.indexDir, "manifest.json");
  const manifest = previousManifest ?? createDefaultManifest(projectConfig.project_id, nowIso);

  assertCanonicalStatuses(input.runtimeState.functions);
  assertTransitionLegal(previousCurrent?.functions, input.runtimeState.functions);
  assertReleaseStateConsistency(input.runtimeState, input.releaseState);

  const snapshotFile = `PD_STATE_${compactTimestamp}_${randomHex(7)}.json`;
  const nextEventSeq = manifest.latest_event_seq + 1;
  const nextUpdateSeq = manifest.latest_update_seq + 1;
  const eventId = `PD_EVT_${compactTimestamp}_${padSeq(nextEventSeq)}_release_readiness_computed`;
  const eventFile = `${eventId}.json`;
  const updateFile = `PD_UPD_${compactTimestamp}_${padSeq(nextUpdateSeq)}_${slugify("state_sync")}.md`;

  const nextCurrent = toStateFile(
    input.runtimeState,
    input.releaseState,
    snapshotFile,
    nowIso,
    previousCurrent?.current_snapshot ?? null
  );
  const snapshotText = stableJson(nextCurrent);
  const snapshotSha = await sha256Hex(snapshotText);

  const event: EventFile = {
    schema_version: SCHEMA_VERSION,
    event_id: eventId,
    seq: nextEventSeq,
    created_at: nowIso,
    type: "release_readiness_computed",
    actor: input.actor ?? "system",
    function_id: null,
    payload: {
      approved_for_release: input.runtimeState.approvedForRelease,
      ready_for_commit: input.releaseState.readyForCommit,
      blocking_functions: input.releaseState.blockingFunctions,
      required_functions: input.releaseState.requiredFunctions,
      accepted_functions: input.releaseState.acceptedFunctions
    },
    snapshot_ref: snapshotFile,
    supersedes: null
  };
  const eventText = stableJson(event);
  const eventSha = await sha256Hex(eventText);

  const updateText = buildUpdateMarkdown({
    nowIso,
    summary: input.summary ?? "Synchronized runtime state to ProofDesk contract files.",
    changedFiles: input.changedFiles ?? [],
    releaseState: input.releaseState,
    runtimeState: input.runtimeState,
    snapshotFile,
    eventFile
  });
  const updateSha = await sha256Hex(updateText);

  const nextManifest: ManifestFile = {
    schema_version: SCHEMA_VERSION,
    project_id: projectConfig.project_id,
    generated_at: nowIso,
    latest_snapshot: snapshotFile,
    latest_event_seq: nextEventSeq,
    latest_update_seq: nextUpdateSeq,
    items: [
      ...manifest.items,
      {
        type: "snapshot",
        file: `proofdesk/state/snapshots/${snapshotFile}`,
        sha256: snapshotSha,
        created_at: nowIso,
        supersedes: previousCurrent?.current_snapshot ?? null
      },
      {
        type: "event",
        file: `proofdesk/events/${eventFile}`,
        sha256: eventSha,
        created_at: nowIso,
        supersedes: null
      },
      {
        type: "update",
        file: `proofdesk/updates/${updateFile}`,
        sha256: updateSha,
        created_at: nowIso,
        supersedes: null
      }
    ]
  };

  await writeTextFile(layout.snapshotsDir, snapshotFile, snapshotText);
  await writeTextFile(layout.eventsDir, eventFile, eventText);
  await writeTextFile(layout.updatesDir, updateFile, updateText);
  await writeTextFile(layout.stateDir, "current.json", stableJson(nextCurrent));
  await writeTextFile(layout.indexDir, "manifest.json", stableJson(nextManifest));

  return {
    rootPath: "proofdesk",
    snapshotFile,
    eventFile,
    updateFile,
    currentFile: "current.json",
    manifestFile: "manifest.json",
    eventSeq: nextEventSeq,
    updateSeq: nextUpdateSeq
  };
}

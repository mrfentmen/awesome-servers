/**
 * Microcks REST client.
 *
 * Base URL and token come from the environment because Microcks is self-hosted:
 *   MICROCKS_BASE_URL  e.g. https://microcks.example.com/api
 *   MICROCKS_TOKEN     optional bearer token (Keycloak / service account)
 */

const DEFAULT_BASE_URL = "https://microcks.example.com/api";

export class MicrocksError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MicrocksError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
}

export interface MicrocksService {
  id?: string;
  name?: string;
  version?: string;
  type?: string;
  labels: Record<string, string>;
}

export interface MicrocksJob {
  id?: string;
  name?: string;
  repository?: string;
  branch?: string;
  frequency?: string;
  active?: boolean;
  lastExecution?: number;
  lastStatus?: string;
}

export interface MicrocksTestResult {
  id?: string;
  serviceId?: string;
  testNumber?: number;
  success?: boolean;
  inProgress?: boolean;
  elapsedTime?: number;
  createdDate?: number;
}

export interface MicrocksSecret {
  id?: string;
  name?: string;
  description?: string;
}

export interface MicrocksMetrics {
  title: string;
  rows: Array<{ label: string; value: string }>;
}

function baseUrl(): string {
  const raw = (process.env.MICROCKS_BASE_URL ?? DEFAULT_BASE_URL).trim();
  return raw.replace(/\/+$/, "");
}

function authHeaders(): Record<string, string> {
  const token = process.env.MICROCKS_TOKEN?.trim();
  // Microcks can be deployed without authentication, so a missing token is not
  // an error: we simply send no Authorization header.
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function asObj(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function field(value: unknown, key: string): unknown {
  return asObj(value)[key];
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${baseUrl()}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function errorDetail(res: Response): Promise<string> {
  const raw = await res.text().catch(() => "");
  const trimmed = raw.trim();
  if (trimmed === "") return `${res.status} ${res.statusText}`;
  try {
    const body = asObj(JSON.parse(trimmed) as unknown);
    const message = str(body.message) ?? str(body.error) ?? str(body.detail);
    if (message) return message;
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return trimmed.slice(0, 300);
}

async function request(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<unknown> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = { Accept: "application/json", ...authHeaders() };
  const init: RequestInit = { method, headers, signal: AbortSignal.timeout(30000) };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MicrocksError(`Cannot reach Microcks at ${baseUrl()}: ${detail}`);
  }

  if (!res.ok) {
    throw new MicrocksError(`Microcks ${res.status} on ${method} ${path}: ${await errorDetail(res)}`);
  }

  // DELETE and several PUT endpoints answer 204 with no body at all.
  if (res.status === 204) return null;
  const raw = await res.text();
  if (raw.trim() === "") return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new MicrocksError(`Microcks returned non-JSON for ${method} ${path}: ${raw.slice(0, 200)}`);
  }
}

/** Text path: Microcks snapshots are YAML/JSON documents, not API JSON. */
async function requestText(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
  contentType = "text/plain"
): Promise<string> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = { Accept: "*/*", ...authHeaders() };
  const init: RequestInit = { method, headers, signal: AbortSignal.timeout(60000) };

  if (options.body !== undefined) {
    headers["Content-Type"] = contentType;
    init.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MicrocksError(`Cannot reach Microcks at ${baseUrl()}: ${detail}`);
  }

  if (!res.ok) {
    throw new MicrocksError(`Microcks ${res.status} on ${method} ${path}: ${await errorDetail(res)}`);
  }
  return res.text();
}

function parseLabels(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(asObj(value))) {
    const text = str(raw);
    if (text) out[key] = text;
  }
  return out;
}

function parseService(value: unknown): MicrocksService {
  return {
    id: str(field(value, "id")),
    name: str(field(value, "name")),
    version: str(field(value, "version")),
    type: str(field(value, "type")),
    labels: parseLabels(field(value, "labels")),
  };
}

function parseJob(value: unknown): MicrocksJob {
  return {
    id: str(field(value, "id")),
    name: str(field(value, "name")),
    repository: str(field(value, "repository")),
    branch: str(field(value, "branch")),
    frequency: str(field(value, "frequency")),
    active: bool(field(value, "active")),
    lastExecution: num(field(value, "lastExecution")),
    lastStatus: str(field(value, "lastStatus")),
  };
}

function parseTestResult(value: unknown): MicrocksTestResult {
  return {
    id: str(field(value, "id")),
    serviceId: str(field(value, "serviceId")),
    testNumber: num(field(value, "testNumber")),
    success: bool(field(value, "success")),
    inProgress: bool(field(value, "inProgress")),
    elapsedTime: num(field(value, "elapsedTime")),
    createdDate: num(field(value, "createdDate")),
  };
}

function parseSecret(value: unknown): MicrocksSecret {
  return {
    id: str(field(value, "id")),
    name: str(field(value, "name")),
    description: str(field(value, "description")),
  };
}

function listOf(value: unknown): unknown[] {
  const items = asArr(field(value, "items"));
  if (items.length > 0) return items;
  return asArr(value);
}

function formatLabels(labels: Record<string, string>): string {
  const keys = Object.keys(labels);
  if (keys.length === 0) return "none";
  return keys.map((key) => `${key}=${labels[key]}`).join(", ");
}

export function formatService(service: MicrocksService, index?: number): string {
  const prefix = index === undefined ? "" : `${index + 1}. `;
  const lines = [
    `${prefix}${service.name ?? "(unnamed service)"}${service.version ? ` ${service.version}` : ""}`,
    `   type: ${service.type ?? "unknown"}`,
    `   id: ${service.id ?? "unknown"}`,
    `   labels: ${formatLabels(service.labels)}`,
  ];
  return lines.join("\n");
}

export function formatServices(services: MicrocksService[]): string {
  if (services.length === 0) return "No services found.";
  return services.map((service, index) => formatService(service, index)).join("\n");
}

export function formatJob(job: MicrocksJob, index?: number): string {
  const prefix = index === undefined ? "" : `${index + 1}. `;
  return [
    `${prefix}${job.name ?? "(unnamed job)"}${job.active === false ? " (inactive)" : ""}`,
    `   repository: ${job.repository ?? "unknown"}`,
    `   branch: ${job.branch ?? "unknown"}`,
    `   frequency: ${job.frequency ?? "unknown"}`,
    `   last status: ${job.lastStatus ?? "never run"}`,
    `   id: ${job.id ?? "unknown"}`,
  ].join("\n");
}

export function formatJobs(jobs: MicrocksJob[]): string {
  if (jobs.length === 0) return "No import jobs found.";
  return jobs.map((job, index) => formatJob(job, index)).join("\n");
}

export function formatTestResult(result: MicrocksTestResult, index?: number): string {
  const prefix = index === undefined ? "" : `${index + 1}. `;
  const status = result.inProgress ? "running" : result.success ? "PASSED" : "FAILED";
  const elapsed = result.elapsedTime === undefined ? "unknown" : `${result.elapsedTime} ms`;
  return `${prefix}test #${result.testNumber ?? "?"} — ${status} — ${elapsed} — id ${result.id ?? "?"}`;
}

export function formatTestResults(results: MicrocksTestResult[]): string {
  if (results.length === 0) return "No test results found.";
  return results.map((result, index) => formatTestResult(result, index)).join("\n");
}

export function formatSecret(secret: MicrocksSecret, index?: number): string {
  const prefix = index === undefined ? "" : `${index + 1}. `;
  const description = secret.description ? ` — ${secret.description}` : "";
  return `${prefix}${secret.name ?? "(unnamed secret)"}${description} (id ${secret.id ?? "?"})`;
}

export function formatSecrets(secrets: MicrocksSecret[]): string {
  if (secrets.length === 0) return "No secrets found.";
  return secrets.map((secret, index) => formatSecret(secret, index)).join("\n");
}

export function formatMetrics(metrics: MicrocksMetrics): string {
  if (metrics.rows.length === 0) return `${metrics.title}: no data.`;
  const lines = [metrics.title];
  for (const row of metrics.rows) lines.push(`   ${row.label}: ${row.value}`);
  return lines.join("\n");
}

function scalarRows(value: unknown, skip: string[] = []): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  for (const [key, raw] of Object.entries(asObj(value))) {
    if (skip.includes(key)) continue;
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      rows.push({ label: key, value: String(raw) });
    }
  }
  return rows;
}

// ---------------------------------------------------------------- services

export async function listServices(name?: string, labels?: string): Promise<MicrocksService[]> {
  const payload = await request("GET", "/services", { query: { name, labels } });
  return listOf(payload).map(parseService);
}

export async function searchServices(name: string): Promise<MicrocksService[]> {
  const payload = await request("GET", "/services/search", { query: { name } });
  return listOf(payload).map(parseService);
}

export async function countServices(): Promise<number> {
  const payload = await request("GET", "/services/count");
  return num(asObj(payload).count) ?? num(payload) ?? 0;
}

export async function listServiceLabels(): Promise<string[]> {
  const payload = await request("GET", "/services/labels");
  return asArr(payload).map((item) => str(item) ?? String(item));
}

export async function getService(id: string): Promise<MicrocksService | null> {
  const payload = await request("GET", `/services/${encodeURIComponent(id)}`);
  if (payload === null) return null;
  return parseService(payload);
}

export async function deleteService(id: string): Promise<void> {
  await request("DELETE", `/services/${encodeURIComponent(id)}`);
}

export async function updateServiceMetadata(
  id: string,
  metadata: Record<string, unknown>
): Promise<MicrocksService | null> {
  const payload = await request("PUT", `/services/${encodeURIComponent(id)}/metadata`, { body: metadata });
  if (payload === null) return null;
  return parseService(payload);
}

// -------------------------------------------------------------------- jobs

export async function listJobs(): Promise<MicrocksJob[]> {
  const payload = await request("GET", "/jobs");
  return listOf(payload).map(parseJob);
}

export async function createJob(body: Record<string, unknown>): Promise<MicrocksJob | null> {
  const payload = await request("POST", "/jobs", { body });
  if (payload === null) return null;
  return parseJob(payload);
}

export async function getJob(id: string): Promise<MicrocksJob | null> {
  const payload = await request("GET", `/jobs/${encodeURIComponent(id)}`);
  if (payload === null) return null;
  return parseJob(payload);
}

export async function updateJob(id: string, body: Record<string, unknown>): Promise<MicrocksJob | null> {
  const payload = await request("POST", `/jobs/${encodeURIComponent(id)}`, { body });
  if (payload === null) return null;
  return parseJob(payload);
}

export async function deleteJob(id: string): Promise<void> {
  await request("DELETE", `/jobs/${encodeURIComponent(id)}`);
}

const JOB_ACTION_PAST: Record<"activate" | "start" | "stop", string> = {
  activate: "activated",
  start: "started",
  stop: "stopped",
};

export async function setJobState(id: string, action: "activate" | "start" | "stop"): Promise<string> {
  await request("PUT", `/jobs/${encodeURIComponent(id)}/${action}`);
  return `Job ${id} ${JOB_ACTION_PAST[action]}.`;
}

// ------------------------------------------------------------------- tests

export async function createTest(
  serviceId: string,
  testEndpoint: string,
  timeout?: number
): Promise<MicrocksTestResult | null> {
  const body: Record<string, unknown> = { serviceId, testEndpoint };
  if (timeout !== undefined) body.timeout = timeout;
  const payload = await request("POST", "/tests", { body });
  if (payload === null) return null;
  return parseTestResult(payload);
}

export async function listTestResults(serviceId: string): Promise<MicrocksTestResult[]> {
  const payload = await request("GET", `/tests/service/${encodeURIComponent(serviceId)}`);
  return listOf(payload).map(parseTestResult);
}

export async function countTestResults(serviceId: string): Promise<number> {
  const payload = await request("GET", `/tests/service/${encodeURIComponent(serviceId)}/count`);
  return num(asObj(payload).count) ?? num(payload) ?? 0;
}

export async function latestTestResults(): Promise<MicrocksTestResult[]> {
  const payload = await request("GET", "/metrics/tests/latest");
  return listOf(payload).map(parseTestResult);
}

// ----------------------------------------------------------------- secrets

export async function listSecrets(): Promise<MicrocksSecret[]> {
  const payload = await request("GET", "/secrets");
  return listOf(payload).map(parseSecret);
}

export async function createSecret(
  name: string,
  value: string,
  description?: string
): Promise<MicrocksSecret | null> {
  const body: Record<string, unknown> = { name, value };
  if (description !== undefined) body.description = description;
  const payload = await request("POST", "/secrets", { body });
  if (payload === null) return null;
  return parseSecret(payload);
}

export async function updateSecret(
  id: string,
  value: string,
  description?: string
): Promise<MicrocksSecret | null> {
  const body: Record<string, unknown> = { value };
  if (description !== undefined) body.description = description;
  const payload = await request("PUT", `/secrets/${encodeURIComponent(id)}`, { body });
  if (payload === null) return null;
  return parseSecret(payload);
}

export async function deleteSecret(id: string): Promise<void> {
  await request("DELETE", `/secrets/${encodeURIComponent(id)}`);
}

// ----------------------------------------------------------------- metrics

export async function getConformanceAggregate(): Promise<MicrocksMetrics> {
  const payload = await request("GET", "/metrics/conformance/aggregate");
  const rows: Array<{ label: string; value: string }> = asArr(payload).length > 0 ? [] : scalarRows(payload, ["title"]);
  if (rows.length === 0) {
    for (const item of asArr(payload)) rows.push(...scalarRows(item));
  }
  return { title: "Conformance metrics", rows };
}

export async function getServiceConformance(serviceId: string): Promise<MicrocksMetrics> {
  const payload = await request("GET", `/metrics/conformance/service/${encodeURIComponent(serviceId)}`);
  return { title: `Conformance for service ${serviceId}`, rows: scalarRows(payload) };
}

export async function getGlobalInvocations(day?: number): Promise<MicrocksMetrics> {
  const payload = await request("GET", "/metrics/invocations/global", { query: { day } });
  return { title: "Global invocation statistics", rows: scalarRows(payload) };
}

export async function getLatestGlobalInvocations(): Promise<MicrocksMetrics> {
  const payload = await request("GET", "/metrics/invocations/global/latest");
  return { title: "Latest invocation statistics", rows: scalarRows(payload) };
}

export async function getTopInvocations(day?: number, limit?: number): Promise<MicrocksMetrics> {
  const payload = await request("GET", "/metrics/invocations/top", { query: { day, limit } });
  const rows = listOf(payload).map((item) => {
    const name = str(field(item, "serviceName")) ?? "unknown";
    const version = str(field(item, "serviceVersion")) ?? "";
    const count = num(field(item, "count")) ?? 0;
    return { label: `${name} ${version}`.trim(), value: String(count) };
  });
  return { title: "Top invoked services", rows };
}

export async function getServiceInvocations(
  serviceName: string,
  serviceVersion: string
): Promise<MicrocksMetrics> {
  const payload = await request(
    "GET",
    `/metrics/invocations/${encodeURIComponent(serviceName)}/${encodeURIComponent(serviceVersion)}`
  );
  return {
    title: `Invocations for ${serviceName} ${serviceVersion}`,
    rows: scalarRows(payload),
  };
}

// --------------------------------------------------------------- resources

export async function listResources(name: string): Promise<string> {
  return requestText("GET", `/resources/${encodeURIComponent(name)}`);
}

export async function listServiceResources(serviceId: string): Promise<string> {
  return requestText("GET", `/resources/service/${encodeURIComponent(serviceId)}`);
}

// ---------------------------------------------------- snapshots and config

export async function exportSnapshot(): Promise<string> {
  return requestText("GET", "/export");
}

export async function importSnapshot(snapshot: string): Promise<string> {
  const response = await requestText("POST", "/import", { body: snapshot }, "text/plain");
  return response.trim() === "" ? "Snapshot imported." : response;
}

export async function getFeaturesConfig(): Promise<MicrocksMetrics> {
  const payload = await request("GET", "/features/config");
  return { title: "Microcks features", rows: scalarRows(payload) };
}


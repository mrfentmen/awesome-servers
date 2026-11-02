import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RUBY = {
  language: "Ruby",
  binEnv: "RUBY_BIN",
  defaultBin: "ruby",
  extension: ".rb",
  installHint:
    "install Ruby from https://www.ruby-lang.org/en/documentation/installation/ (or `brew install ruby`), then make sure `ruby` is on PATH or set RUBY_BIN=/full/path/to/ruby",
};

const MAX_STREAM_CHARS = 20000;
const DEFAULT_TIMEOUT_MS = 10000;
const INTROSPECT_TIMEOUT_MS = 30000;

/** Resolved from the compiled file, so it works from dist/ and from a global install. */
const INTROSPECT_SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "scripts",
  "introspect.rb",
);

export class ToolchainMissingError extends Error {
  readonly config: typeof RUBY;
  readonly bin: string;

  constructor(config: typeof RUBY, bin: string) {
    super(
      `The ${config.language} interpreter was not found (tried "${bin}"). ` +
        `Install it: ${config.installHint}. ` +
        `You can also point ${config.binEnv} at the binary.`,
    );
    this.config = config;
    this.bin = bin;
    this.name = "ToolchainMissingError";
  }
}

/** The interpreter answered, but the request itself was invalid (unknown class, no such method, ...). */
export class LookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LookupError";
  }
}

export interface RunResult {
  bin: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  truncated: boolean;
}

export interface MethodRecord {
  name: string;
  signature: string;
  owner: string;
  kind: "instance" | "singleton";
  visibility: string;
  parameters: { kind: string; name: string | null }[];
  arity: number;
  parameters_rendered: string;
  implementation: "C" | "Ruby";
  source_location: [string, number] | null;
  docs_url: string | null;
}

export interface VersionInfo {
  ruby_version: string;
  patchlevel: number;
  description: string;
  engine: string;
  engine_version: string;
  platform: string;
  default_encoding: string;
  internal_encoding: string;
  rubylibdir: string;
  archdir: string;
  bindir: string;
  gem_dir: string | null;
  load_path_entries: number;
  rubygems: string | null;
  stdlib_modules_visible: number;
}

export interface ClassMatch {
  name: string;
  kind: "class" | "module";
  superclass: string | null;
  instance_methods: number;
  docs_url: string;
}

export interface ClassSearch {
  query: string;
  total_matches: number;
  classes: ClassMatch[];
}

export interface ClassInfo {
  name: string;
  kind: "class" | "module";
  superclass: string | null;
  superclass_chain: string[];
  ancestors: string[];
  included_modules: string[];
  instance_method_counts: Record<string, number>;
  singleton_method_counts: Record<string, number>;
  instance_methods_total: number;
  constants: string[];
  stdlib: boolean;
  implementation: string;
  loaded_features: string[];
  docs_url: string;
}

export interface MethodList {
  name: string;
  kind: "instance" | "singleton";
  include_inherited: boolean;
  total: number;
  shown: number;
  limit_per_group: number;
  groups: Record<string, MethodRecord[]>;
}

export interface MethodSearch {
  query: string;
  class: string | null;
  searched_classes: number;
  matches: MethodRecord[];
}

export interface ConstantInfo {
  path: string;
  type: string;
  inspect: string;
  frozen: boolean | null;
  source_location: [string, number] | null;
  docs_url: string | null;
}

export interface VersionComparison {
  a: { input: string; normalized: string; segments: number[] };
  b: { input: string; normalized: string; segments: number[] };
  comparison: number;
  relation: string;
  prerelease: { a: boolean; b: boolean };
}

function resolveBin(): string {
  const override = process.env[RUBY.binEnv];
  return override && override.trim() !== "" ? override.trim() : RUBY.defaultBin;
}

function spawnCollect(
  bin: string,
  argv: string[],
  cwd: string | undefined,
  timeoutMs: number,
  stdin?: string,
  maxChars: number = MAX_STREAM_CHARS,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let truncated = false;
    let timedOut = false;
    let settled = false;

    const child = spawn(bin, argv, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const collect = (chunk: Buffer, into: "out" | "err"): void => {
      const target = into === "out" ? stdout : stderr;
      if (target.length >= maxChars) {
        truncated = true;
        return;
      }
      const next = target + chunk.toString();
      if (next.length > maxChars) {
        truncated = true;
        const clipped = next.slice(0, maxChars);
        if (into === "out") stdout = clipped;
        else stderr = clipped;
        return;
      }
      if (into === "out") stdout = next;
      else stderr = next;
    };

    child.stdout.on("data", (c: Buffer) => collect(c, "out"));
    child.stderr.on("data", (c: Buffer) => collect(c, "err"));

    if (stdin !== undefined) {
      child.stdin.end(stdin, "utf8");
    } else {
      child.stdin.end();
    }

    child.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      if (e.code === "ENOENT") reject(new ToolchainMissingError(RUBY, bin));
      else reject(e);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({
        bin,
        exitCode: code,
        signal,
        timedOut,
        durationMs: Date.now() - started,
        stdout,
        stderr,
        truncated,
      });
    });
  });
}

/**
 * Ask the local interpreter to introspect itself. Everything the server reports
 * about classes and methods comes back through here, so the answers always match
 * the Ruby that is actually installed.
 */
export async function introspect<T>(request: Record<string, unknown>): Promise<T> {
  const bin = resolveBin();
  // The introspection payload is parsed, not shown, so it needs a much larger cap
  // than human-facing process output.
  const result = await spawnCollect(
    bin,
    [INTROSPECT_SCRIPT, JSON.stringify(request)],
    undefined,
    INTROSPECT_TIMEOUT_MS,
    undefined,
    8_000_000,
  );
  if (result.timedOut) {
    throw new Error(
      `Introspection timed out after ${result.durationMs} ms (${String(request["op"])}).`,
    );
  }
  const body = result.stdout.trim();
  if (body === "") {
    const detail = result.stderr.trim();
    throw new Error(
      detail === ""
        ? `The interpreter produced no output (exit ${String(result.exitCode)}).`
        : `The interpreter failed: ${detail}`,
    );
  }
  let parsed: { ok?: boolean; data?: unknown; error?: string };
  try {
    parsed = JSON.parse(body) as { ok?: boolean; data?: unknown; error?: string };
  } catch {
    throw new Error(`Could not read the introspection response: ${body.slice(0, 400)}`);
  }
  if (parsed.ok !== true) {
    throw new LookupError(parsed.error ?? "The interpreter returned an unknown error.");
  }
  return parsed.data as T;
}

/** Write code to a temp directory and run it with the local interpreter. */
export async function runRubyFile(options: {
  code: string;
  args?: string[];
  timeoutMs?: number;
  checkOnly?: boolean;
}): Promise<RunResult> {
  const bin = resolveBin();
  const dir = await mkdtemp(join(tmpdir(), "ruby-mcp-run-"));
  const file = join(dir, `main${RUBY.extension}`);
  try {
    await writeFile(file, options.code, "utf8");
    const argv = options.checkOnly ? ["-c", file] : [file, ...(options.args ?? [])];
    return await spawnCollect(bin, argv, dir, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Probe the interpreter without running user code. */
export function checkToolchain(): { bin: string; found: boolean; origin: "env" | "path"; detail: string } {
  const override = process.env[RUBY.binEnv];
  const fromEnv = Boolean(override && override.trim() !== "");
  const bin = resolveBin();
  const probe = spawnSync(bin, ["--version"], { timeout: 5000, encoding: "utf8" });
  if (probe.error && (probe.error as NodeJS.ErrnoException).code === "ENOENT") {
    return {
      bin,
      found: false,
      origin: fromEnv ? "env" : "path",
      detail: `not found. ${RUBY.installHint}`,
    };
  }
  if (probe.error) {
    return {
      bin,
      found: false,
      origin: fromEnv ? "env" : "path",
      detail: `could not be started: ${probe.error.message}`,
    };
  }
  const firstLine = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return {
    bin,
    found: true,
    origin: fromEnv ? "env" : "path",
    detail: firstLine ?? `exit code ${String(probe.status)}`,
  };
}

export function formatStatus(status: ReturnType<typeof checkToolchain>): string {
  if (!status.found) {
    return (
      `${RUBY.language} interpreter: NOT FOUND\n` +
      `Looked for: ${status.bin} (from ${status.origin === "env" ? RUBY.binEnv : "PATH"})\n` +
      `Install: ${RUBY.installHint}`
    );
  }
  const version = checkVersionLine(status.bin);
  return (
    `${RUBY.language} interpreter: found\n` +
    `Binary: ${status.bin} (from ${status.origin === "env" ? RUBY.binEnv : "PATH"})\n` +
    `Version: ${version}\n` +
    `Introspection script: ${INTROSPECT_SCRIPT}`
  );
}

function checkVersionLine(bin: string): string {
  const probe = spawnSync(bin, ["-e", "print RUBY_DESCRIPTION"], { timeout: 5000, encoding: "utf8" });
  const out = (probe.stdout ?? "").trim();
  return out === "" ? "(could not read RUBY_DESCRIPTION)" : out;
}

export function formatResult(result: RunResult): string {
  const head = result.timedOut
    ? `Timed out after ${result.durationMs} ms - the process was killed (SIGKILL).`
    : `Ran ${result.bin} (exit ${result.exitCode === null ? `signal ${String(result.signal)}` : String(result.exitCode)}, ${result.durationMs} ms)`;
  const parts = [head];
  parts.push(`stdout:\n${result.stdout.trim() === "" ? "(empty)" : result.stdout.trimEnd()}`);
  parts.push(`stderr:\n${result.stderr.trim() === "" ? "(empty)" : result.stderr.trimEnd()}`);
  if (result.truncated) parts.push(`[output truncated at ${MAX_STREAM_CHARS} chars per stream]`);
  return parts.join("\n\n");
}

export function formatSyntaxResult(result: RunResult): string {
  const clean = (text: string): string => text.replace(/\/[^\s:]*ruby-mcp-run-[^\s:]*\/main\.rb/g, "main.rb");
  if (result.timedOut) {
    return `Syntax check timed out after ${result.durationMs} ms.`;
  }
  if (result.exitCode === 0) {
    return `Syntax OK (${result.durationMs} ms)\n${clean(result.stdout).trim() || "ruby -c reported no problems."}`;
  }
  return [
    `Syntax error (exit ${String(result.exitCode)})`,
    clean(result.stderr).trim() || clean(result.stdout).trim() || "(no diagnostic text)",
  ].join("\n\n");
}

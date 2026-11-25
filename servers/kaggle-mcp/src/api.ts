import { execFile } from "child_process";
import { readFileSync, mkdirSync } from "node:fs";

export class KaggleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KaggleError";
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function kaggleBin(): string {
  return process.env.KAGGLE_BIN ?? "kaggle";
}

function env(): Record<string, string> {
  const e: Record<string, string> = { PATH: process.env.PATH ?? "/usr/bin:/bin" };
  for (const k of ["KAGGLE_CONFIG_DIR", "KAGGLE_USERNAME", "KAGGLE_KEY", "HOME", "VIRTUAL_ENV"]) {
    if (process.env[k]) e[k] = process.env[k]!;
  }
  return e;
}

function run(args: string[], maxChars: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      kaggleBin(),
      args,
      { timeout: 300000, maxBuffer: 64 * 1024 * 1024, env: env() },
      (err, stdout, _stderr) => {
        if (err) {
          reject(new KaggleError(`${args[0]} ${args[1] ?? ""} failed: ${err.message}`.slice(0, 500)));
          return;
        }
        resolve(stdout.slice(0, maxChars));
      }
    );
  });
}

export function kernelStatus(id: string): Promise<string> {
  // `kaggle kernels status` prints one line; normalize to it
  return run(["kernels", "status", id], 500);
}

export function kernelList(search?: string): Promise<string> {
  const args = ["kernels", "list", "--mine"];
  if (search) args.push("--search", search);
  return run(args, 4000);
}

export async function kernelLog(id: string, tailLines = 40): Promise<string> {
  // downloads log then returns the tail (the CLI only prints the path)
  mkdirSync("/tmp/kagglemcp", { recursive: true });
  await run(["kernels", "output", id, "-p", "/tmp/kagglemcp"], 500);
  const slug = id.split("/").pop() ?? id;
  const raw = readFileSync(`/tmp/kagglemcp/${slug}.log`, "utf8");
  const lines = raw.split("\n");
  // log entries are JSON-ish blobs — pull exception/error lines first
  const hits = lines.filter((l: string) =>
    /Traceback|Error|Exception|Killed|killed|OOM/i.test(l) && !/SyntaxWarning|escape sequence/i.test(l)
  );
  const tail = lines.slice(-tailLines).join("\n");
  return (hits.slice(-15).join("\n") + "\n---TAIL---\n" + tail).slice(0, 20000);
}

export function datasetList(search?: string, mine = false): Promise<string> {
  const args = ["datasets", "list"];
  if (mine) args.push("--mine");
  if (search) args.push("--search", search);
  return run(args, 4000);
}

export function datasetStatus(ref: string): Promise<string> {
  return run(["datasets", "status", ref], 500);
}

export function kernelPush(dir: string): Promise<string> {
  return run(["kernels", "push", "-p", dir], 1000);
}

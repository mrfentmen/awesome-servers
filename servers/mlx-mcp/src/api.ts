import { execFile } from "child_process";
import { readFileSync, existsSync } from "node:fs";

export class MlxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MlxError";
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function mlxBin(tool: string): string {
  return process.env.MLX_BIN_DIR ? `${process.env.MLX_BIN_DIR}/${tool}` : tool;
}

function env(): Record<string, string> {
  const e: Record<string, string> = { PATH: process.env.PATH ?? "/usr/bin:/bin" };
  for (const k of ["HOME", "VIRTUAL_ENV", "HF_TOKEN", "HF_HUB_CACHE"]) {
    if (process.env[k]) e[k] = process.env[k]!;
  }
  return e;
}

function run(tool: string, args: string[], maxChars: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      mlxBin(tool),
      args,
      { timeout: 0, maxBuffer: 64 * 1024 * 1024, env: env() },
      (err: Error | null, stdout: string, _stderr: string) => {
        if (err) {
          reject(new MlxError(`${tool} failed: ${err.message}`.slice(0, 500)));
          return;
        }
        resolve(stdout.slice(-maxChars));
      }
    );
  });
}

export function loraTrain(opts: {
  model: string; data: string; adapterPath: string; iters?: string;
  batchSize?: string; numLayers?: string; learningRate?: string;
}): Promise<string> {
  const args = [
    "--model", opts.model,
    "--train",
    "--data", opts.data,
    "--adapter-path", opts.adapterPath,
    "--iters", opts.iters ?? "300",
    "--batch-size", opts.batchSize ?? "2",
    "--num-layers", opts.numLayers ?? "16",
  ];
  if (opts.learningRate) args.push("--learning-rate", opts.learningRate);
  // NOTE: granite base has no chat template — feed pre-formatted {"text": ...} rows, not messages
  return run("mlx_lm.lora", args, 4000);
}

export function generate(opts: {
  model: string; adapterPath?: string; prompt: string; maxTokens?: string; temp?: string;
}): Promise<string> {
  const args = ["--model", opts.model, "--prompt", opts.prompt,
    "--max-tokens", opts.maxTokens ?? "150", "--temp", opts.temp ?? "0.0"];
  if (opts.adapterPath) args.push("--adapter-path", opts.adapterPath);
  return run("mlx_lm.generate", args, 6000);
}

export function trainLogTail(logPath: string, lines = 15): Promise<string> {
  if (!existsSync(logPath)) return Promise.resolve("no log yet");
  const all = readFileSync(logPath, "utf8").split("\n");
  return Promise.resolve(all.slice(-lines).join("\n").slice(0, 4000));
}

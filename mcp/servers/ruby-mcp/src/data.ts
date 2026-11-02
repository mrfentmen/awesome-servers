import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

export interface Keyword {
  word: string;
  kind: "keyword" | "pseudo_variable";
}

export interface OperatorRow {
  level: number;
  name: string;
  operators: string[];
}

export interface Sample {
  name: string;
  path: string;
  bytes: number;
  code: string;
  exit_code: number;
  stdout: string;
  stderr: string;
}

export interface Meta {
  language: string;
  site: string;
  docs: string;
  generated_with: string;
  ruby_version: string;
  engine: string;
  generated_at: string;
  keywords: number;
  operators: number;
  precedence_levels: number;
  operator_checks: number;
  samples: number;
  notes: string[];
}

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as T;
}

let keywordCache: Keyword[] | undefined;
let operatorCache: OperatorRow[] | undefined;
let sampleCache: Sample[] | undefined;
let metaCache: Meta | undefined;

export function keywords(): Keyword[] {
  keywordCache ??= load<Keyword[]>("keywords.json");
  return keywordCache;
}

export function operatorRows(): OperatorRow[] {
  operatorCache ??= load<OperatorRow[]>("operators.json");
  return operatorCache;
}

export function samples(): Sample[] {
  sampleCache ??= load<Sample[]>("samples.json");
  return sampleCache;
}

export function meta(): Meta {
  metaCache ??= load<Meta>("meta.json");
  return metaCache;
}

export function findSample(name: string): Sample | undefined {
  const wanted = name.trim().toLowerCase();
  const withExt = wanted.endsWith(".rb") ? wanted : `${wanted}.rb`;
  return samples().find((s) => s.name.toLowerCase() === withExt || s.name.toLowerCase().startsWith(withExt));
}

export function formatOperatorTable(): string {
  const rows = operatorRows();
  const width = rows.length.toString().length;
  const lines = rows.map((row) => {
    const level = row.level.toString().padStart(width);
    const name = row.name.padEnd(46);
    return `  ${level}. ${name} ${row.operators.join("  ")}`;
  });
  return [
    "Ruby operator precedence, tightest binding first (level 1 binds hardest):",
    "",
    ...lines,
    "",
    "Notes:",
    "  - `**` and assignment are right associative; the arithmetic and comparison operators are left associative.",
    "  - Unary minus binds looser than `**`, so -2 ** 2 is -4 while (-2) ** 2 is 4.",
    "  - `&&` binds tighter than `||`; both bind tighter than `and` / `or`.",
    "  - Modifier forms (expr if cond, expr rescue expr) bind loosest of all.",
  ].join("\n");
}

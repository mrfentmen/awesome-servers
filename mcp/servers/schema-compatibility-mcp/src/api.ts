

// ---- muxF tools:
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { SchemaError } from "./core.js";

const SCHEMA_KEYWORDS = [
  "$schema", "$id", "$ref", "$defs", "definitions", "properties", "patternProperties",
  "additionalProperties", "items", "prefixItems", "required", "enum", "const",
  "type", "format", "allOf", "anyOf", "oneOf", "not", "if", "then", "else",
  "nullable", "readOnly", "writeOnly", "deprecated", "title", "description",
  "default", "examples", "discriminator", "xml", "externalDocs", "minimum",
  "maximum", "exclusiveMinimum", "exclusiveMaximum", "minLength", "maxLength",
  "pattern", "minItems", "maxItems", "uniqueItems", "multipleOf",
];

async function jsonFile(input: string): Promise<{ value: unknown; bytes: number }> {
  const base = process.env.SCHEMA_COMPATIBILITY_ROOT ?? path.join(process.cwd(), "..");
  const root = await realpath(path.resolve(base)).catch(() => path.resolve(base));
  const req = path.isAbsolute(input) ? path.resolve(input) : path.resolve(root, input);
  const target = await realpath(req).catch(() => req);
  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new SchemaError("Schema path must stay inside the configured root");
  const info = await stat(target).catch(() => null);
  if (!info?.isFile() || info.size > 2 * 1024 * 1024) throw new SchemaError("Schema must be a bounded JSON file");
  const raw = await readFile(target, "utf8");
  try {
    return { value: JSON.parse(raw), bytes: info.size };
  } catch {
    throw new SchemaError("Input must contain valid JSON");
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function entropyOf(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  let bits = 0;
  for (const n of counts) {
    if (n <= 0) continue;
    const p = n / total;
    bits -= p * Math.log2(p);
  }
  return bits;
}

/** A keyword census of a JSON Schema document: how many times each schema keyword appears, and nothing else. */
export async function schemaProfile(input: { schema: string }): Promise<string> {
  const { value, bytes } = await jsonFile(input.schema ?? "");
  const root = asObject(value);
  if (!root) throw new SchemaError("Input must be a JSON object to be read as a schema document");
  const counts = new Map<string, number>();
  let objects = 0;
  let arrays = 0;
  let scalars = 0;
  let maxDepth = 0;
  const visit = (node: unknown, depth: number): void => {
    if (depth > 40) return;
    if (depth > maxDepth) maxDepth = depth;
    if (Array.isArray(node)) {
      arrays += 1;
      for (const item of node) visit(item, depth + 1);
      return;
    }
    const obj = asObject(node);
    if (obj) {
      objects += 1;
      for (const [key, child] of Object.entries(obj)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        visit(child, depth + 1);
      }
      return;
    }
    scalars += 1;
  };
  visit(root, 0);
  const known = SCHEMA_KEYWORDS.map((k) => [k, counts.get(k) ?? 0] as const).filter(([, n]) => n > 0);
  const unknown = [...counts.entries()].filter(([k]) => !SCHEMA_KEYWORDS.includes(k));
  const enumSizes: number[] = [];
  const requiredCounts: number[] = [];
  const collect = (node: unknown, depth: number): void => {
    if (depth > 40) return;
    if (Array.isArray(node)) {
      for (const item of node) collect(item, depth + 1);
      return;
    }
    const obj = asObject(node);
    if (!obj) return;
    if (Array.isArray(obj.enum)) enumSizes.push(obj.enum.length);
    if (Array.isArray(obj.required)) requiredCounts.push(obj.required.length);
    for (const child of Object.values(obj)) collect(child, depth + 1);
  };
  collect(root, 0);
  const defs = (counts.get("$defs") ?? 0) + (counts.get("definitions") ?? 0);
  const properties = counts.get("properties") ?? 0;
  return [
    "Schema keyword census (counts only: no property names, values, paths or schema text)",
    `File size: ${bytes} bytes`,
    `Nodes walked: ${objects} object(s), ${arrays} array(s), ${scalars} scalar value(s), deepest nesting ${maxDepth} level(s)`,
    `Reusable definitions declared ($defs or definitions keywords): ${defs}`,
    `Nodes carrying a properties keyword: ${properties}`,
    `Required lists found: ${requiredCounts.length}${requiredCounts.length ? `, holding ${requiredCounts.reduce((a, b) => a + b, 0)} required name(s) in total, largest list ${Math.max(...requiredCounts)}` : ""}`,
    `Enums found: ${enumSizes.length}${enumSizes.length ? `, ${enumSizes.reduce((a, b) => a + b, 0)} allowed value(s) in total, largest enum ${Math.max(...enumSizes)}` : ""}`,
    `Keyword frequencies: ${known.length ? known.map(([k, n]) => `${k} ${n}`).join(", ") : "no schema keywords found"}`,
    `Keys that are not schema keywords: ${unknown.length ? `${unknown.length} distinct, ${unknown.map(([, n]) => n).reduce((a, b) => a + b, 0)} occurrence(s)` : "none"}`,
    "Frequencies count how often a keyword appears anywhere in the document; no key is named.",
  ].join("\n");
}

/** The depth and breadth of any JSON document: nodes per level, object fan-out and array length distribution. */
export async function nestingProfile(input: { document: string }): Promise<string> {
  const { value, bytes } = await jsonFile(input.document ?? "");
  const perLevel: number[] = [];
  const fanOut: number[] = []
  const arrayLengths: number[] = []
  let scalars = 0
  let objects = 0
  let arrays = 0
  let maxDepth = 0
  let deepestPathKind = "not reported"
  const visit = (node: unknown, depth: number, kind: string): void => {
    if (depth > 60) return
    if (depth > maxDepth) {
      maxDepth = depth
      deepestPathKind = kind
    }
    perLevel[depth] = (perLevel[depth] ?? 0) + 1
    if (Array.isArray(node)) {
      arrays += 1
      arrayLengths.push(node.length)
      for (const item of node) visit(item, depth + 1, "array item")
      return
    }
    const obj = asObject(node)
    if (obj) {
      objects += 1
      const keys = Object.keys(obj)
      if (keys.length) fanOut.push(keys.length)
      for (const child of Object.values(obj)) visit(child, depth + 1, "object member")
      return
    }
    scalars += 1
  }
  visit(value, 0, "root")
  const mean = (values: number[]): string =>
    values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "not reported"
  const buckets = (values: number[], edges: number[]): string =>
    values.length
      ? edges
          .map((edge, i) => {
            const hi = edges[i + 1]
            const n = hi === undefined ? values.filter((v) => v > edge).length : values.filter((v) => v > edge && v <= hi).length
            return hi === undefined ? `>${edge}: ${n}` : `${edge + 1}-${hi}: ${n}`
          })
          .join(", ")
      : "not reported"
  return [
    "JSON depth and breadth profile (counts only: no property names, values, paths or schema text)",
    `File size: ${bytes} bytes`,
    `Nodes: ${objects} object(s), ${arrays} array(s), ${scalars} scalar value(s), ${objects + arrays + scalars} in total`,
    `Deepest nesting: ${maxDepth} level(s), reached by ${deepestPathKind}`,
    `Nodes per level: ${perLevel.map((n, i) => `L${i} ${n}`).join(", ")}`,
    `Object fan-out: ${fanOut.length} object(s) with keys, mean ${mean(fanOut)} keys, largest ${fanOut.length ? Math.max(...fanOut) : 0}`,
    `Array lengths: ${arrayLengths.length} array(s), mean ${mean(arrayLengths)}, total elements ${arrayLengths.reduce((a, b) => a + b, 0)}, largest ${arrayLengths.length ? Math.max(...arrayLengths) : 0}`,
    `Array length distribution: ${buckets(arrayLengths, [0, 1, 5, 20, 100])}`,
    "Fan-out and array lengths are counted, never the keys or items themselves.",
  ].join("\n");
}

/** How varied a document's property-name vocabulary is, measured without printing a single name. */
export async function keyVocabulary(input: { document: string }): Promise<string> {
  const { value, bytes } = await jsonFile(input.document ?? "");
  const usage = new Map<string, number>()
  const lengths: number[] = []
  let occurrences = 0
  let objects = 0
  const visit = (node: unknown, depth: number): void => {
    if (depth > 60) return
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1)
      return
    }
    const obj = asObject(node)
    if (!obj) return
    objects += 1
    for (const [key, child] of Object.entries(obj)) {
      usage.set(key, (usage.get(key) ?? 0) + 1)
      lengths.push([...key].length)
      occurrences += 1
      visit(child, depth + 1)
    }
  }
  visit(value, 0)
  if (!occurrences) return "That document contains no object property names, so there is no vocabulary to measure."
  const counts = [...usage.values()]
  const once = counts.filter((n) => n === 1).length
  const heavy = counts.filter((n) => n >= 10).length
  const entropy = entropyOf(counts)
  const ideal = Math.log2(usage.size || 1)
  const meanLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  return [
    "Property-name vocabulary statistics (no property name is printed)",
    `File size: ${bytes} bytes`,
    `Objects carrying names: ${objects}, name occurrences: ${occurrences}`,
    `Distinct names: ${usage.size}`,
    `Names used once: ${once} (${((once / usage.size) * 100).toFixed(1)}% of the vocabulary)`,
    `Names used 10 or more times: ${heavy}`,
    `Name reuse: mean ${(occurrences / usage.size).toFixed(2)} occurrences per distinct name`,
    `Shannon entropy of the usage distribution: ${entropy.toFixed(3)} bits against an even spread of ${ideal.toFixed(3)} bits for ${usage.size} distinct name(s)`,
    `Uniformity: ${ideal > 0 ? ((entropy / ideal) * 100).toFixed(1) : "0.0"}% of a perfectly even vocabulary`,
    `Name length in characters: shortest ${Math.min(...lengths)}, mean ${meanLength.toFixed(1)}, longest ${Math.max(...lengths)}`,
    "Entropy and reuse say how repetitive a schema's vocabulary is without disclosing it.",
  ].join("\n");
}

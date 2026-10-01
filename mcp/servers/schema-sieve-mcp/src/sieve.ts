import { readFile, realpath } from "node:fs/promises"
import path from "node:path"

const MAX_BYTES = 2 * 1024 * 1024
const MAX_DEPTH = 12
const MAX_PROPERTIES = 300
const MAX_OUTPUT = 14000
const SENSITIVE = /example|default|token|secret|password|api[-_]?key|authorization|cookie|credential|private|secret/i

export class SieveError extends Error {}
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Schema = Record<string, unknown>

async function safePath(file: string): Promise<string> {
  const configured = process.env.SCHEMA_SIEVE_ROOT ?? path.join(process.cwd(), "..")
  const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured))
  const target = await realpath(path.resolve(file)).catch(() => path.resolve(file))
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new SieveError(`Schema path must stay inside ${root}`)
  return target
}

async function load(file: string): Promise<Schema> {
  const target = await safePath(file)
  const bytes = await readFile(target)
  if (bytes.byteLength > MAX_BYTES) throw new SieveError(`Schema exceeds ${MAX_BYTES} byte limit`)
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString("utf8")) } catch { throw new SieveError("Only JSON Schema files are supported in this release") }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new SieveError("The root JSON value must be a schema object")
  return parsed as Schema
}

function typeOf(schema: Schema): string | string[] | null {
  const value = schema.type
  if (typeof value === "string" || Array.isArray(value) && value.every((item) => typeof item === "string")) return value as string | string[]
  if (schema.properties) return "object"
  if (schema.items) return "array"
  return null
}

function constraintSummary(schema: Schema): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ["format", "pattern", "minLength", "maxLength", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minItems", "maxItems", "uniqueItems", "minProperties", "maxProperties"]) {
    if (key in schema && !SENSITIVE.test(key)) out[key] = schema[key]
  }
  if (Array.isArray(schema.enum)) out.enumCount = schema.enum.length
  if (Array.isArray(schema.required)) out.requiredCount = schema.required.filter((item) => typeof item === "string").length
  return out
}

function summarizeSchema(schema: Schema, depth = 0): Record<string, unknown> {
  if (depth > MAX_DEPTH) return { truncated: true }
  const out: Record<string, unknown> = { type: typeOf(schema), constraints: constraintSummary(schema) }
  if (typeof schema.const !== "undefined") out.hasConst = true
  if (Array.isArray(schema.required)) out.required = schema.required.filter((item): item is string => typeof item === "string").slice(0, MAX_PROPERTIES).map((name) => SENSITIVE.test(name) ? "[sensitive property omitted]" : name.slice(0, 160))
  if (schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)) {
    const required = new Set(Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : [])
    out.properties = Object.entries(schema.properties as Record<string, unknown>).slice(0, MAX_PROPERTIES).map(([name, child]) => {
      const safeName = SENSITIVE.test(name) ? "[sensitive property omitted]" : name.slice(0, 160)
      const childSummary = child && typeof child === "object" && !Array.isArray(child) ? summarizeSchema(child as Schema, depth + 1) : { type: null }
      return { name: safeName, required: required.has(name), ...childSummary }
    })
  }
  if (schema.items && typeof schema.items === "object" && !Array.isArray(schema.items)) out.items = summarizeSchema(schema.items as Schema, depth + 1)
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (Array.isArray(schema[key])) out[key] = schema[key].slice(0, 20).map((item) => item && typeof item === "object" && !Array.isArray(item) ? summarizeSchema(item as Schema, depth + 1) : { type: null })
  }
  return out
}

function placeholder(schema: Schema, depth = 0): string {
  if (depth > MAX_DEPTH) return "<truncated>"
  const type = typeOf(schema)
  if (type === "object" || schema.properties) return "<object assembled from child placeholders>"
  if (type === "array" || schema.items) return "<array with one child placeholder>"
  if (Array.isArray(type)) return `<${type.filter((item) => item !== "null")[0] ?? "value"}>`
  if (type === "string") return schema.format ? `<string:${String(schema.format).slice(0, 30)}>` : "<string>"
  if (type === "integer" || type === "number") return `<${type}>`
  if (type === "boolean") return "<boolean>"
  return "<value>"
}

function fixturePaths(schema: Schema, prefix = "#", depth = 0): Array<Record<string, unknown>> {
  if (depth > MAX_DEPTH || !schema || typeof schema !== "object") return []
  const out: Array<Record<string, unknown>> = []
  if (schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)) {
    const required = new Set(Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : [])
    for (const [name, child] of Object.entries(schema.properties as Record<string, unknown>).slice(0, MAX_PROPERTIES)) {
      if (SENSITIVE.test(name)) { out.push({ path: `${prefix}.[sensitive property omitted]`, required: required.has(name), omitted: true, reason: "sensitive-like property name" }); continue }
      const childSchema = child && typeof child === "object" && !Array.isArray(child) ? child as Schema : {}
      out.push({ path: `${prefix}.${name}`, required: required.has(name), placeholder: placeholder(childSchema, depth + 1), constraints: constraintSummary(childSchema) })
      out.push(...fixturePaths(childSchema, `${prefix}.${name}`, depth + 1).slice(0, MAX_PROPERTIES))
    }
  }
  return out.slice(0, MAX_PROPERTIES)
}

export async function inspect(file: string): Promise<Record<string, unknown>> {
  const schema = await load(file)
  return { summary: summarizeSchema(schema), warning: "Examples, defaults, constants, and sensitive-like property names are omitted. This is structural guidance, not a validator." }
}

export async function plan(file: string): Promise<Record<string, unknown>> {
  const schema = await load(file)
  return { fixtureMode: "placeholder-plan", rootPlaceholder: placeholder(schema), paths: fixturePaths(schema), warning: "No example or default values are copied. Replace placeholders with test-owned data and validate with your own schema library." }
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT) }
export const limits = { MAX_BYTES, MAX_DEPTH, MAX_PROPERTIES }

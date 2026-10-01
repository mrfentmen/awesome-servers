

// ---- muxF tools:
import { readFile, realpath } from "node:fs/promises"
import path from "node:path"
import { ScoutError } from "./scout.js"

const SCOUT_MAX_BYTES = 2 * 1024 * 1024
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

const SENSITIVE_KEY = /example|default|security|token|secret|password|api[-_]?key|authorization|cookie|credential/i
const SHAPE_KEYWORDS = [
  '$ref', 'allOf', 'anyOf', 'oneOf', 'not', 'enum', 'const', 'discriminator', 'format',
  'nullable', 'readOnly', 'writeOnly', 'deprecated', 'pattern', 'items', 'additionalProperties',
]

interface SpecShape {
  openapi: string | null
  title: string | null
  operationCount: number
  operations: Array<{ path: string; method: string; operationId?: string; tags: string[]; hasParams: boolean; hasResponses: boolean; hasBody: boolean }>
  schemaCount: number
  schemaPropertyCounts: Array<{ name: string; count: number }>
  shapeKeywordCounts: Record<string, number>
  requiredTotal: number
  propertyTotal: number
  maxSchemaDepth: number
  serversDeclared: number
  urlPathsDropped: number
  sensitiveKeys: number
}

async function readSpec(file: string): Promise<Record<string, unknown>> {
  const root = await realpath(path.resolve(process.env.OPENAPI_SCOUT_ROOT ?? path.join(process.cwd(), ".."))).catch(() => path.resolve(process.env.OPENAPI_SCOUT_ROOT ?? path.join(process.cwd(), "..")))
  const target = await realpath(path.resolve(file)).catch(() => path.resolve(file))
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new ScoutError(`Spec path must stay inside ${root}`)
  const buffer = await readFile(target)
  if (buffer.byteLength > SCOUT_MAX_BYTES) throw new ScoutError(`Spec exceeds ${SCOUT_MAX_BYTES} byte limit`)
  try {
    return JSON.parse(buffer.toString("utf8")) as Record<string, unknown>
  } catch {
    throw new ScoutError("Only JSON OpenAPI or Swagger files are supported in this release; convert YAML to JSON first")
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function shapeOf(spec: Record<string, unknown>): SpecShape {
  const paths = asRecord(spec.paths) ?? {}
  const components = asRecord(spec.components) ?? {}
  const definitions = asRecord(components.schemas) ?? asRecord(spec.definitions) ?? {}
  const operations: SpecShape["operations"] = []
  for (const [route, item] of Object.entries(paths)) {
    const pathItem = asRecord(item)
    if (!pathItem) continue
    for (const [method, value] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.includes(method.toLowerCase())) continue
      const op = asRecord(value)
      if (!op) continue
      const tags = Array.isArray(op.tags) ? op.tags.filter((t): t is string => typeof t === 'string') : []
      const params = Array.isArray(op.parameters) ? op.parameters : []
      const hasBody = params.some((p) => asRecord(p)?.in === 'body') || method.toLowerCase() === 'post' || method.toLowerCase() === 'put' || method.toLowerCase() === 'patch'
      operations.push({
        path: route,
        method: method.toUpperCase(),
        operationId: typeof op.operationId === 'string' ? op.operationId : undefined,
        tags,
        hasParams: params.length > 0,
        hasResponses: asRecord(op.responses) !== null,
        hasBody,
      })
    }
  }
  const shapeKeywordCounts: Record<string, number> = {}
  let requiredTotal = 0
  let propertyTotal = 0
  let maxSchemaDepth = 0
  const schemaPropertyCounts: Array<{ name: string; count: number }> = []
  const walkSchema = (node: unknown, depth: number): void => {
    if (depth > 20) return
    if (depth > maxSchemaDepth) maxSchemaDepth = depth
    const obj = asRecord(node)
    if (!obj) return
    for (const [key, child] of Object.entries(obj)) {
      if (SHAPE_KEYWORDS.includes(key)) shapeKeywordCounts[key] = (shapeKeywordCounts[key] ?? 0) + 1
    }
    const properties = asRecord(obj.properties)
    if (properties) {
      for (const child of Object.values(properties)) walkSchema(child, depth + 1)
      if (Array.isArray(obj.required)) requiredTotal += obj.required.length
    }
    walkSchema(obj.items, depth + 1)
    walkSchema(obj.additionalProperties, depth + 1)
    for (const key of ['allOf', 'anyOf', 'oneOf']) {
      if (Array.isArray(obj[key])) for (const child of obj[key]) walkSchema(child, depth + 1)
    }
  }
  for (const [name, schema] of Object.entries(definitions)) {
    const before = countProperties(schema)
    schemaPropertyCounts.push({ name, count: before })
    propertyTotal += before
    walkSchema(schema, 0)
  }
  const servers = Array.isArray(spec.servers) ? spec.servers : []
  let urlPathsDropped = 0
  for (const server of servers) {
    const url = asRecord(server)?.url
    if (typeof url === 'string') {
      try {
        const parsed = new URL(url)
        if (parsed.pathname && parsed.pathname !== '/') urlPathsDropped += 1
      } catch {
        urlPathsDropped += 1
      }
    }
  }
  let sensitiveKeys = 0
  const countSensitive = (node: unknown, depth: number): void => {
    if (depth > 24) return
    if (Array.isArray(node)) {
      for (const item of node.slice(0, 5000)) countSensitive(item, depth + 1)
      return
    }
    const obj = asRecord(node)
    if (!obj) return
    for (const [key, child] of Object.entries(obj)) {
      if (SENSITIVE_KEY.test(key)) sensitiveKeys += 1
      countSensitive(child, depth + 1)
    }
  }
  countSensitive(spec, 0)
  const info = asRecord(spec.info)
  return {
    openapi: typeof spec.openapi === 'string' ? spec.openapi : typeof spec.swagger === 'string' ? spec.swagger : null,
    title: typeof info?.title === 'string' ? info.title : null,
    operationCount: operations.length,
    operations,
    schemaCount: Object.keys(definitions).length,
    schemaPropertyCounts,
    shapeKeywordCounts,
    requiredTotal,
    propertyTotal,
    maxSchemaDepth,
    serversDeclared: servers.length,
    urlPathsDropped,
    sensitiveKeys,
  }
}

function countProperties(schema: unknown): number {
  const direct = asRecord(schema)?.properties
  if (direct) return Object.keys(direct).length
  return 0
}

function histogram(values: number[], edges: number[]): string {
  if (!values.length) return 'not reported'
  return edges
    .map((edge, i) => {
      const hi = edges[i + 1]
      const n = hi === undefined ? values.filter((v) => v > edge).length : values.filter((v) => v > edge && v <= hi).length
      return hi === undefined ? `more than ${edge}: ${n}` : `${edge + 1} to ${hi}: ${n}`
    })
    .join(', ')
}

/** A coverage matrix over the operations: methods, tags, and how many operations are missing an id, tags or a response block. */
export async function operationMatrix(args: { file: string }): Promise<string> {
  const spec = await readSpec(args.file ?? '')
  const shape = shapeOf(spec)
  if (!shape.operationCount) throw new ScoutError('That spec declares no operations, so there is no matrix to build.')
  const byMethod = new Map<string, number>()
  const byTag = new Map<string, number>()
  const byDepth = new Map<number, number>()
  let noId = 0
  let noTags = 0
  let noParams = 0
  let noResponses = 0
  for (const op of shape.operations) {
    byMethod.set(op.method, (byMethod.get(op.method) ?? 0) + 1)
    if (!op.operationId) noId += 1
    if (op.tags.length) for (const tag of op.tags) byTag.set(tag, (byTag.get(tag) ?? 0) + 1)
    else noTags += 1
    if (!op.hasParams) noParams += 1
    if (!op.hasResponses) noResponses += 1
    const depth = op.path.split('/').filter(Boolean).length
    byDepth.set(depth, (byDepth.get(depth) ?? 0) + 1)
  }
  const top = (map: Map<string, number>, cap: number): string =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, cap).map(([k, n]) => `${k} ${n}`).join(', ')
  const verbHeavy = byMethod.get('GET') ?? 0
  return [
    `Operation coverage for ${shape.title ?? 'untitled spec'} (${shape.openapi ?? 'version not reported'})`,
    `Operations: ${shape.operationCount} across ${new Set(shape.operations.map((o) => o.path)).size} path(s)`,
    `By method: ${top(byMethod, 10)}`,
    verbHeavy ? `Read share: ${((verbHeavy / shape.operationCount) * 100).toFixed(1)}% of operations are GET, ${((1 - verbHeavy / shape.operationCount) * 100).toFixed(1)}% change or remove something.` : 'Read share: no GET operation is declared.',
    `Distinct tags: ${byTag.size}${byTag.size ? `, leading them: ${top(byTag, 10)}` : ''}`,
    `Operations with no operationId: ${noId} of ${shape.operationCount}, so client generators will invent method names for them`,
    `Operations with no tags: ${noTags}`,
    `Operations with no parameters block: ${noParams}`,
    `Operations with no responses block: ${noResponses}`,
    `Path depth: ${[...byDepth.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d} segment(s) ${n}`).join(', ')}`,
    'These are counts read from the file. No example, default or credential-like value is reported.',
  ].join('\n')
}

/** A shape census of the component schemas: how many properties they hold, how many are required, and which schema keywords are used. */
export async function schemaShapeReport(args: { file: string; limit?: number }): Promise<string> {
  const spec = await readSpec(args.file ?? '')
  const shape = shapeOf(spec)
  if (!shape.schemaCount) throw new ScoutError('That spec declares no component schemas.')
  const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 10), 40))
  const counts = shape.schemaPropertyCounts.map((s) => s.count)
  const requiredShare = shape.propertyTotal ? (shape.requiredTotal / shape.propertyTotal) * 100 : 0
  const keywordEntries = Object.entries(shape.shapeKeywordCounts).sort((a, b) => b[1] - a[1])
  const biggest = [...shape.schemaPropertyCounts].sort((a, b) => b.count - a.count).slice(0, limit)
  const noProperties = shape.schemaPropertyCounts.filter((s) => s.count === 0)
  return [
    `Schema shape census for ${shape.title ?? 'untitled spec'}`,
    `Component schemas: ${shape.schemaCount}`,
    `Properties declared across them: ${shape.propertyTotal}, of which ${shape.requiredTotal} are required (${requiredShare.toFixed(1)}%)`,
    `Mean properties per schema: ${(shape.propertyTotal / shape.schemaCount).toFixed(2)}`,
    `Property count distribution: ${histogram(counts, [0, 3, 10, 25, 50])}`,
    `Deepest schema nesting: ${shape.maxSchemaDepth} level(s)`,
    `Schemas with no direct properties: ${noProperties.length}${noProperties.length ? ` (${noProperties.slice(0, 6).map((s) => s.name).join(', ')}${noProperties.length > 6 ? ', ...' : ''})` : ''}`,
    `Schema keywords in use: ${keywordEntries.length ? keywordEntries.map(([k, n]) => `${k} ${n}`).join(', ') : 'none beyond the property vocabulary'}`,
    `Widest schemas (up to ${limit}): ${biggest.map((s) => `${s.name} (${s.count})`).join(', ')}`,
    'Property names are not printed anywhere in this census, only their counts.',
  ].join('\n')
}

/** How much of a local spec looks like material a reader should not see, counted without printing any of it. */
export async function redactionAudit(args: { file: string }): Promise<string> {
  const spec = await readSpec(args.file ?? '')
  const shape = shapeOf(spec)
  const servers = Array.isArray(spec.servers) ? spec.servers : []
  const securitySchemes = asRecord(asRecord(spec.components)?.securitySchemes)
  const swaggerSec = asRecord(spec.securityDefinitions)
  const schemeCount = (securitySchemes ? Object.keys(securitySchemes).length : 0) + (swaggerSec ? Object.keys(swaggerSec).length : 0)
  return [
    `Redaction audit of ${shape.title ?? 'untitled spec'}`,
    `Spec size walked: bounded at ${SCOUT_MAX_BYTES} bytes; version ${shape.openapi ?? 'not reported'}`,
    `Keys matching the example, default, security or credential pattern: ${shape.sensitiveKeys} across the whole document`,
    `Operations: ${shape.operationCount}, component schemas: ${shape.schemaCount}`,
    `Security schemes declared: ${schemeCount} (all suppressed by the inspector)`,
    `Servers declared: ${shape.serversDeclared}, of which ${shape.urlPathsDropped} carry a non-empty path, so the path segment is dropped to the origin`,
    shape.sensitiveKeys > 500
      ? 'That is a lot of suppressed material, so a diff of the redacted output against the raw file is worth more than a summary.'
      : 'That is a small amount of suppressed material, so a summary loses little.',
    'This audit counts the material that gets hidden. It never prints an example, default, token or credential.',
  ].join('\n')
}

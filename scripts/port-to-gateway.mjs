#!/usr/bin/env node
/**
 * Move a gated MCP package's premium tools onto the gateway.
 *
 * Why: a premium tool whose body ships inside the package can be un-paywalled by
 * deleting the local licence check from `dist/`. The bodies therefore have to run
 * on the gateway, behind the Polar gate, and the package has to become a thin
 * caller. Doing that by hand for ~600 packages is the whole problem; this script
 * does the mechanical part and refuses anything it cannot do exactly.
 *
 * For one package it:
 *   1. reads `src/server.ts` to learn which function implements each premium tool
 *   2. extracts that function's closure from the BUILT `dist/*.js`
 *      (compiled, so every TypeScript annotation is already gone; the ported code
 *      is the same code the package already runs, not a paraphrase of it)
 *   3. asks the built server over MCP `tools/list` for the tool's real
 *      description and JSON Schema
 *   4. writes `gateway/src/tools-mcp-<slug>.js`
 *   5. rewrites the package: `src/gateway.ts` added, `src/license.ts` deleted,
 *      the paywall block replaced with a gateway call, the local body deleted
 *      from `src/api.ts`, README buy link repointed at Polar
 *   6. rebuilds and proves the premium bodies are gone from `dist/`
 *
 * Nothing is written unless every step above can be done. A package that needs a
 * judgement call is reported as SKIP with a reason and left untouched.
 *
 * Usage:
 *   node scripts/port-to-gateway.mjs --list /tmp/batch.json [--write] [--limit N]
 *   node scripts/port-to-gateway.mjs baconipsum-mcp archive-org-mcp --write
 *
 * Without --write it is a dry run: it prints what it would do and writes nothing.
 * It never publishes and never deploys.
 */

import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const SERVERS = path.join(REPO, 'servers')
const GATEWAY_SRC = process.env.GATEWAY_SRC
  ?? path.join(os.homedir(), 'Desktop', 'repo-cleanup', 'gateway', 'src')
const BUY_URL = 'https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4'
const GATEWAY_TOOL_PREFIX = 'mcp_'

const argv = process.argv.slice(2)
const write = argv.includes('--write')
const listFlag = argv.indexOf('--list')
const limitFlag = argv.indexOf('--limit')
const limit = limitFlag === -1 ? Infinity : Number(argv[limitFlag + 1])
const positional = argv.filter((a, i) => !a.startsWith('--')
  && argv[i - 1] !== '--list' && argv[i - 1] !== '--limit')

function names() {
  if (listFlag !== -1) {
    const raw = JSON.parse(fs.readFileSync(argv[listFlag + 1], 'utf8'))
    return raw.map((entry) => (typeof entry === 'string' ? entry : entry.name))
  }
  return positional
}

// ---------------------------------------------------------------------------
// Reading a package
// ---------------------------------------------------------------------------

function premiumFunctions(serverSource) {
  // A premium tool is marked by a paywall block. Between the `end` of that block
  // and the close of the tool registration is the call that does the work, and
  // that is the function whose body has to move to the gateway.
  const out = []
  const blockRe = /\/\/ ---- paywall: (?!end\b)([a-z0-9_\-]+) ----\n([\s\S]*?)\/\/ ---- paywall: end ----/g
  for (const match of serverSource.matchAll(blockRe)) {
    const tool = match[1]
    // The gate block itself should be nothing but the check and its early return:
    // anything else there is logic this script cannot move.
    const gateLines = match[2].split('\n').map((l) => l.trim()).filter(Boolean)
    const gateShapeOk = gateLines.length <= 2
      && gateLines.every((l) => l.includes('premiumRequired(') || l.includes('paywallMessage')
        || l.startsWith('if (') || l.startsWith('return '))
    if (!gateShapeOk) {
      return { error: `${tool}: the gate block has ${gateLines.length} lines - port by hand` }
    }
    const afterStart = match.index + match[0].length
    const registrationEnd = serverSource.indexOf('\n  )', afterStart)
    const body = serverSource.slice(afterStart, registrationEnd === -1 ? undefined : registrationEnd)
    const calls = [...body.matchAll(/await\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1])
      .filter((name) => name !== 'premiumRequired')
    if (calls.length !== 1) {
      return { error: `${tool}: expected exactly one call after the gate, found ${calls.length}` }
    }
    // Anything beyond a try/catch around that one call is logic this script will
    // not guess at, so the package is reported and left alone.
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 3) {
      return { error: `${tool}: handler has ${lines.length} lines after the gate - port by hand` }
    }
    if (!lines.some((l) => l.includes(`await ${calls[0]}(`))) {
      return { error: `${tool}: handler never calls ${calls[0]}() after the gate` }
    }
    // The exact arguments the original handler passed, so the gateway wrapper
    // can reproduce the call instead of passing the whole argument object.
    const sigAt = serverSource.lastIndexOf('async (', match.index)
    const sigEnd = sigAt === -1 ? -1 : serverSource.indexOf(') =>', sigAt)
    const rawParam = sigAt !== -1 && sigEnd !== -1 ? serverSource.slice(sigAt + 'async ('.length, sigEnd).trim() : ''
    const param = /^[A-Za-z_$][\w$]*$/.test(rawParam) ? rawParam : undefined
    const callAt = serverSource.indexOf(`await ${calls[0]}(`, match.index)
    const openParen = callAt === -1 ? -1 : serverSource.indexOf('(', callAt)
    const callArgs = openParen === -1 ? undefined : balancedParens(serverSource, openParen)
    out.push({ tool, fn: calls[0], param, callArgs })
  }
  if (!out.length) return { error: 'no paywall blocks found' }
  return { tools: out }
}

/** Top-level declarations in a compiled ES module: functions and consts. */
function declarations(source) {
  const found = new Map()
  const fnRe = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm
  let m
  while ((m = fnRe.exec(source))) {
    const start = m.index
    // The body brace, not the first `{` to appear: a default parameter like
    // `args = {}` puts one inside the signature first.
    const open = bodyBraceFrom(source, start)
    const end = matchBrace(source, open)
    if (end === -1) continue
    found.set(m[1], { kind: 'function', text: source.slice(start, end + 1) })
  }
  // A class is a declaration too: an error type like `GalaxyError` is reached
  // from the premium function and has to travel with it.
  const classRe = /^(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b/gm
  while ((m = classRe.exec(source))) {
    const start = m.index
    const open = source.indexOf('{', m.index + m[0].length - 1)
    const end = matchBrace(source, open)
    if (end === -1) continue
    found.set(m[1], { kind: 'class', text: source.slice(start, end + 1) })
  }
  const constRe = /^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=/gm
  while ((m = constRe.exec(source))) {
    const start = m.index
    const end = declarationEnd(source, start)
    if (end === -1) continue
    found.set(m[1], { kind: 'const', text: source.slice(start, end).trimEnd() })
  }
  return found
}

/**
 * Where a top-level declaration really ends.
 *
 * A newline is not enough: `const normalise = (value) =>` continues on the next,
 * indented line, and stopping at the newline leaves the arrow's body behind as
 * orphaned code. Top-level declarations start in column zero and their
 * continuations are indented, so that is the rule used here.
 */
function declarationEnd(source, start) {
  const lines = source.slice(start).split('\n')
  let last = 0
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed === '') {
      // A blank line ends the declaration unless what follows is still part of
      // it, which an indented line or a closing bracket is.
      const next = lines.slice(i + 1).find((line) => line.trim() !== '') ?? ''
      if (!/^[ \t]/.test(next) && !/^[)\]}]/.test(next.trim())) break
      last = i
      continue
    }
    const indented = /^[ \t]/.test(lines[i])
    // A block-bodied arrow closes on a line at column zero, so `};` still
    // belongs to it even though it is not indented.
    const closes = /^[)\]};]/.test(trimmed)
    if (!indented && !closes) break
    last = i
  }
  const text = lines.slice(0, last + 1).join('\n')
  return start + text.length
}

function matchBrace(source, open) {
  if (open === -1 || source[open] !== '{') return -1
  let depth = 0
  let quote = null
  for (let i = open; i < source.length; i++) {
    const c = source[i]
    // Braces inside a string, a template literal or a comment do not nest: a
    // body that tests `startsWith('{')` would otherwise never close.
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      continue
    }
    if (c === '/' && source[i + 1] === '/') {
      const nl = source.indexOf('\n', i)
      i = nl === -1 ? source.length : nl
      continue
    }
    if (c === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2)
      i = close === -1 ? source.length : close + 1
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * The parameter names of a compiled function declaration, defaults stripped.
 *
 * A ported tool's handler receives one argument object from the package, but the
 * function it wraps takes the individual values, so the names are needed to map
 * one onto the other: `artistReleases(slug, limit)` called with the object would
 * read `slug.trim` off an object.
 */
function parameterNames(text) {
  const at = text.indexOf('(')
  if (at === -1) return []
  let depth = 0
  let quote = null
  let end = -1
  for (let i = at; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) return []
  const inner = text.slice(at + 1, end)
  const parts = []
  let current = ''
  let braces = 0
  let brackets = 0
  let q = null
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (q) {
      current += c
      if (c === '\\') current += inner[++i] ?? ''
      else if (c === q) q = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      q = c
      current += c
      continue
    }
    if (c === '{') braces++
    else if (c === '}') braces--
    else if (c === '[') brackets++
    else if (c === ']') brackets--
    else if (c === ',' && braces === 0 && brackets === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += c
  }
  if (current.trim()) parts.push(current)
  return parts.map((part) => part.trim().split('=')[0].trim().replace(/^\.\.\./, ''))
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name))
}

/**
 * Identifiers a ported body takes from an npm package rather than from this file.
 *
 * Only names the moved code actually mentions are reported, so an unused import
 * in the package does not block a port that would have worked.
 */
function foreignBindings(source, ported) {
  const names = new Set()
  for (const match of source.matchAll(/import\s+([^;]+?)\s+from\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[2]
    if (specifier.startsWith('.') || specifier.startsWith('node:')) continue
    for (const raw of match[1].replace(/[{}*]/g, ' ').split(',')) {
      const name = raw.trim().split(/\s+as\s+/).pop()?.trim() ?? ''
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name)
    }
  }
  const text = ported.map(([, decl]) => decl.text).join('\n')
  return [...names].filter((name) => new RegExp(`\\b${name}\\b`).test(text))
}

/** The text between a `(` and its matching `)`, string-aware. */
function balancedParens(source, open) {
  if (open === -1 || source[open] !== '(') return undefined
  let depth = 0
  let quote = null
  for (let i = open; i < source.length; i++) {
    const c = source[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return undefined
}

/**
 * The arguments a gateway wrapper passes to a ported function.
 *
 * The exact expression the package used is preferred (with its own parameter
 * name swapped for `checked`). When that is not available - a chunk regenerated
 * from a published build, say - the function's own parameter names are read off
 * its declaration and looked up on the checked object, which is the shape every
 * handler in this repo used anyway.
 */
function callArguments(tool, ported) {
  if (typeof tool.callArgs === 'string' && tool.param) {
    return tool.callArgs.replace(new RegExp(`\\b${tool.param}\\b`, 'g'), 'checked')
  }
  const declaration = ported.find(([name]) => name === tool.fn)?.[1]
  const params = declaration ? parameterNames(declaration.text) : []
  if (!params.length) return ''
  const properties = new Set(Object.keys(tool.inputSchema?.properties ?? {}))
  if (params.length === 1 && !properties.has(params[0])) return 'checked'
  return params.map((name) => `checked.${name}`).join(', ')
}

/** End of a top-level `const x = ...` initialiser: the newline that closes it. */
function statementEnd(source, from) {
  let depth = 0
  let quote = null
  for (let i = from; i < source.length; i++) {
    const c = source[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{' || c === '(' || c === '[') depth++
    else if (c === '}' || c === ')' || c === ']') depth--
    else if (c === '\n' && depth === 0) return i
  }
  return -1
}

/** Everything the given roots reach inside this module, in declaration order. */
function closure(all, roots) {
  const need = new Set()
  const queue = [...roots]
  while (queue.length) {
    const name = queue.pop()
    if (need.has(name)) continue
    const decl = all.get(name)
    if (!decl) continue
    need.add(name)
    for (const candidate of all.keys()) {
      if (candidate === name) continue
      if (new RegExp(`\\b${candidate.replace(/\$/g, '\\$')}\\b`).test(decl.text)) queue.push(candidate)
    }
  }
  return [...all.entries()].filter(([name]) => need.has(name))
}

const JS_RESERVED = new Set(['fetch', 'URL', 'URLSearchParams', 'JSON', 'Math', 'Date', 'Number',
  'String', 'Object', 'Array', 'Set', 'Map', 'Promise', 'Error', 'process', 'RegExp', 'Boolean',
  'Intl', 'TextEncoder', 'globalThis', 'console', 'structuredClone', 'queueMicrotask'])

// ---------------------------------------------------------------------------
// Asking the built server what its tools look like
// ---------------------------------------------------------------------------

/** tools/list over the real MCP protocol: authoritative JSON Schema, no guessing. */
function listTools(pkgDir, timeoutMs = 25000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['dist/index.js'], { cwd: pkgDir })
    let buffer = ''
    let settled = false
    const done = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.kill()
      resolve(value)
    }
    const timer = setTimeout(() => done({ error: 'timed out' }), timeoutMs)
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString()
      let index
      while ((index = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, index).trim()
        buffer = buffer.slice(index + 1)
        if (!line) continue
        let msg
        try {
          msg = JSON.parse(line)
        } catch {
          continue
        }
        if (msg.id === 2 && msg.result?.tools) done({ tools: msg.result.tools })
      }
    })
    child.on('error', (err) => done({ error: err.message }))
    child.on('exit', () => done({ error: 'server exited before tools/list' }))
    const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n')
    send({ jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'porter', version: '1' } } })
    send({ jsonrpc: '2.0', method: 'notifications/initialized' })
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
  })
}

// ---------------------------------------------------------------------------
// Emitting the gateway chunk
// ---------------------------------------------------------------------------

const constNameFor = (slug) => `MCP_TOOLS_${slug.replace(/[^a-z0-9]/gi, '_').toUpperCase()}`

/** `node --check` on generated source, so a bad port cannot reach the registry. */
function checkSyntax(text) {
  const file = path.join(os.tmpdir(), `port-check-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`)
  fs.writeFileSync(file, text)
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
    return null
  } catch (err) {
    const detail = [err.stderr, err.stdout, err.message]
      .map((part) => String(part ?? ''))
      .join('\n').split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3).join(' | ')
    return detail
  } finally {
    fs.rmSync(file, { force: true })
  }
}

function chunkSource(slug, packageName, ported, tools) {
  const constName = constNameFor(slug)
  const lines = []
  lines.push('/**')
  lines.push(` * MCP premium tools - chunk \`${slug}\`.`)
  lines.push(' *')
  lines.push(` * The premium tools of \`servers/${packageName}\`. Their bodies used to ship inside the`)
  lines.push(' * published package, where deleting the local licence check from `dist/` kept the')
  lines.push(' * code. They now run here, behind the gate, and the package only calls this server.')
  lines.push(' *')
  lines.push(' * The bodies are the package\'s own compiled output, moved across unchanged, so their')
  lines.push(' * answers are the answers the package already gave. They reach for the global `fetch`')
  lines.push(' * rather than `ctx.fetchImpl`, which is why the tests for this chunk cover')
  lines.push(' * registration, the gate and input checking - the upstream shapes are covered by the')
  lines.push(' * live probe in scripts/probe-mcp-chunks.mjs.')
  lines.push(' */')
  lines.push('')
  lines.push(`export const ${constName} = []`)
  lines.push('')
  lines.push('class ToolInputError extends Error {')
  lines.push('  constructor(message) {')
  lines.push('    super(message)')
  lines.push("    this.name = 'ToolInputError'")
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('/**')
  lines.push(' * Checks a call against the tool\'s own published schema before the ported body sees')
  lines.push(' * it. The package relied on its MCP framework for this; here nothing else will, and')
  lines.push(' * a missing argument must read as a refusal rather than as a crash.')
  lines.push(' */')
  lines.push('function checkArgs(toolName, args, schema) {')
  lines.push('  const value = args && typeof args === \'object\' ? args : {}')
  lines.push('  for (const field of schema?.required ?? []) {')
  lines.push('    if (value[field] === undefined || value[field] === null) {')
  lines.push(`      throw new ToolInputError(\`\\\`\${field}\\\` is required by \\\`\${toolName}\\\`.\`)`)
  lines.push('    }')
  lines.push('  }')
  lines.push('  for (const [field, property] of Object.entries(schema?.properties ?? {})) {')
  lines.push('    const supplied = value[field]')
  lines.push('    if (supplied === undefined || supplied === null) continue')
  lines.push('    const type = property?.type')
  lines.push('    const ok = type === \'integer\' || type === \'number\'')
  lines.push('      ? typeof supplied === \'number\' && Number.isFinite(supplied)')
  lines.push('      : type === \'array\'')
  lines.push('        ? Array.isArray(supplied)')
  lines.push('        : type === \'boolean\'')
  lines.push('          ? typeof supplied === \'boolean\'')
  lines.push('          : type === \'object\'')
  lines.push('            ? typeof supplied === \'object\' && !Array.isArray(supplied)')
  lines.push('            : type === \'string\'')
  lines.push('              ? typeof supplied === \'string\'')
  lines.push('              : true')
  lines.push('    if (!ok) {')
  lines.push(`      throw new ToolInputError(\`\\\`\${field}\\\` must be a \${type}.\`)`)
  lines.push('    }')
  lines.push('  }')
  lines.push('  return value')
  lines.push('}')
  lines.push('')
  lines.push('// ---------------------------------------------------------------------------')
  lines.push('// Ported from the package, unchanged apart from the export keyword.')
  lines.push('// ---------------------------------------------------------------------------')
  lines.push('')
  for (const [, decl] of ported) {
    lines.push(decl.text.replace(/^export\s+/, ''))
    lines.push('')
  }
  lines.push('// ---------------------------------------------------------------------------')
  lines.push('// Tools')
  lines.push('// ---------------------------------------------------------------------------')
  lines.push('')
  for (const tool of tools) {
    const schema = JSON.stringify(tool.inputSchema, null, 2).split('\n').join('\n  ')
    lines.push(`${constName}.push({`)
    lines.push(`  name: '${tool.gatewayName}',`)
    lines.push('  description:')
    lines.push(`    ${JSON.stringify(`${tool.description} Runs on the gateway with a Polar licence key; the same answer the free-form tool gave, metered per call.`).replace(/\\n/g, ' ')}`)
    lines.push('    ,')
    lines.push('  premium: true,')
    lines.push(`  inputSchema: ${schema},`)
    lines.push('  async handler(args) {')
    lines.push(`    const checked = checkArgs('${tool.gatewayName}', args, ${constName}.find((t) => t.name === '${tool.gatewayName}').inputSchema)`)
    lines.push(`    return await ${tool.fn}(${callArguments(tool, ported)})`)
    lines.push('  },')
    lines.push('})')
    lines.push('')
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Rewriting the package
// ---------------------------------------------------------------------------

const GATEWAY_CLIENT = `/**
 * Thin client for the premium gateway.
 *
 * The premium tools do not run in this package any more. Their bodies live on
 * the gateway, which checks a Polar licence key before it does any work, so
 * deleting anything here buys nothing: the answer only exists behind the gate.
 *
 * Set \`MCP_LICENSE_KEY\` to a Polar licence key. \`MCP_GATEWAY_URL\` overrides the
 * endpoint, which is only useful for testing.
 */

const DEFAULT_GATEWAY_URL = 'https://mcp-gateway.contactae2000.workers.dev/mcp'
const DEFAULT_TIMEOUT_MS = 25000
const USER_AGENT = 'mrfentmen-mcp/1.0'

/** Raised when a premium call cannot be completed. \`message\` is safe to show. */
export class GatewayError extends Error {
  constructor(message: string, readonly refused: boolean) {
    super(message)
    this.name = 'GatewayError'
  }
}

interface ContentPart {
  text?: string
}

interface CallResult {
  content?: ContentPart[]
  isError?: boolean
  structuredContent?: { licenceRefusal?: boolean }
}

interface JsonRpcResponse {
  result?: CallResult
  error?: { message?: string }
}

export async function premiumTool(tool: string, args: Record<string, unknown>): Promise<string> {
  const key = (process.env.MCP_LICENSE_KEY ?? '').trim()
  if (!key) {
    throw new GatewayError(
      \`"\${tool}" is a premium tool and no licence key is set. Set MCP_LICENSE_KEY in your MCP client config.\`,
      true,
    )
  }

  const url = (process.env.MCP_GATEWAY_URL ?? DEFAULT_GATEWAY_URL).trim()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': USER_AGENT,
        authorization: \`Bearer \${key}\`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: tool, arguments: args },
      }),
      signal: controller.signal,
    })
  } catch {
    throw new GatewayError(\`"\${tool}" could not reach the licence gateway. Check your connection and try again.\`, false)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new GatewayError(\`"\${tool}" could not reach the licence gateway (HTTP \${response.status}).\`, false)
  }

  let body: JsonRpcResponse
  try {
    body = (await response.json()) as JsonRpcResponse
  } catch {
    throw new GatewayError(\`"\${tool}" got an unreadable answer from the licence gateway.\`, false)
  }

  if (body.error) {
    throw new GatewayError(\`"\${tool}" was refused by the licence gateway: \${body.error.message ?? 'unknown error'}\`, false)
  }

  const result = body.result ?? {}
  const text = (result.content ?? [])
    .map((part) => part.text ?? '')
    .join('\\n')
    .trim()

  if (result.isError) {
    // The gateway marks a licence refusal structurally, so a missing or rejected
    // key is told apart from a tool that failed after the gate let it through.
    if (result.structuredContent?.licenceRefusal) {
      throw new GatewayError(text || \`"\${tool}" needs a valid licence key.\`, true)
    }
    throw new GatewayError(text || \`"\${tool}" failed on the licence gateway.\`, false)
  }
  if (!text) throw new GatewayError(\`"\${tool}" returned no data.\`, false)
  return text
}
`

/**
 * Swaps the local call for a gateway call, touching nothing else.
 *
 * The handler keeps its own structure - only the line that called the local
 * implementation is rewritten and the gate's message lines are dropped - because
 * replacing a whole handler is how a closing brace gets eaten.
 */
function rewriteServer(source, tools) {
  let out = source
  // The error formatter is the house style `textError(<helper>(e))`, but the
  // helper is called `error` in some packages and `errorMessage` in others, so
  // the name is read off the handlers that already exist rather than assumed.
  const formatter = source.match(/textError\(([A-Za-z_$][\w$]*)\(e\)\)/)?.[1] ?? null
  for (const tool of tools) {
    const marker = `// ---- paywall: ${tool.tool} ----`
    const start = out.indexOf(marker)
    if (start === -1) return { error: `${tool.tool}: paywall marker vanished` }
    const markerLineStart = out.lastIndexOf('\n', start) + 1
    const indent = out.slice(markerLineStart, start)

    // The handler's own parameter name: assuming `args` breaks every package
    // that calls it something else.
    const signatureAt = out.lastIndexOf('async (', start)
    const signatureEnd = out.indexOf(') =>', signatureAt)
    if (signatureAt === -1 || signatureEnd === -1) {
      return { error: `${tool.tool}: could not read the handler signature` }
    }
    const parameter = out.slice(signatureAt + 'async ('.length, signatureEnd).trim()
    if (!/^[A-Za-z_$][\w$]*$/.test(parameter)) {
      return { error: `${tool.tool}: handler parameter ${JSON.stringify(parameter)} is not a plain name` }
    }

    const callAt = out.indexOf(`await ${tool.fn}(`, start)
    if (callAt === -1) return { error: `${tool.tool}: no call to ${tool.fn}() left to replace` }
    const callLineStart = out.lastIndexOf('\n', callAt) + 1
    const callLineEnd = out.indexOf('\n', callAt)
    if (callLineEnd === -1) return { error: `${tool.tool}: the call line has no end` }
    const callLine = out.slice(callLineStart, callLineEnd)
    const callIndent = callLine.slice(0, callLine.length - callLine.trimStart().length)
    const onError = formatter ? `textError(${formatter}(e))` : 'textError(String(e))'
    const replacement = `${callIndent}try { return text(await premiumTool("${tool.gatewayName}", ${parameter})) }`
      + ` catch (e) { return ${onError} }`
    out = out.slice(0, callLineStart) + replacement + out.slice(callLineEnd)

    // Now the gate block, between the two markers.
    const gateStart = out.indexOf(marker) + marker.length
    const endMarker = '// ---- paywall: end ----'
    const gateEnd = out.indexOf(endMarker, gateStart)
    if (gateEnd === -1) return { error: `${tool.tool}: paywall end marker vanished` }
    const gate = `${indent}    // The body runs on the gateway, behind the licence gate.\n`
    out = out.slice(0, gateStart + 1) + gate + indent + out.slice(gateEnd)
  }
  return { source: out }
}

/**
 * Drops the premium implementations from the api import and adds the gateway one.
 *
 * The import may be a single line or one binding per line, so the statement is
 * located by its `from` clause and rebuilt rather than matched as a line.
 */
function rewriteImports(source, tools) {
  const fnNames = new Set(tools.map((t) => t.fn))
  // The local gate is gone: the gateway enforces it now.
  let out = source.replace(/^import \{ premiumRequired \} from "\.\/license\.js";?\n?/m, '')
  // Quotes vary between packages, and 65 of them use single quotes.
  const markerOf = (text) => ['from "./api.js"', 'from "./api"', "from './api.js'", "from './api'"]
    .find((m) => text.includes(m))
  if (!markerOf(out)) return { error: 'no import from ./api to rewrite' }

  // A package can import from ./api more than once - a later feature adds its own
  // line - so every one of them is collected and rebuilt as a single import.
  const kept = []
  for (let guard = 0; guard < 20; guard++) {
    const marker = markerOf(out)
    if (!marker) break
    const fromAt = out.indexOf(marker)
    const importAt = out.lastIndexOf('import', fromAt)
    if (importAt === -1) return { error: 'could not find the start of the api import' }
    const statementEnd = fromAt + marker.length
    const statement = out.slice(importAt, statementEnd)
    const open = statement.indexOf('{')
    const close = statement.lastIndexOf('}')
    if (open === -1 || close === -1) return { error: 'the api import is not a named import' }
    for (const name of statement.slice(open + 1, close).split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!fnNames.has(name) && !kept.includes(name)) kept.push(name)
    }
    let end = statementEnd
    if (out[end] === ';') end += 1
    if (out[end] === '\n') end += 1
    out = out.slice(0, importAt) + out.slice(end)
  }

  // Put the rebuilt imports back at the end of the existing import block.
  const lines = out.split('\n')
  let insertAt = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].trim() === '') insertAt = i + 1
    else break
  }
  const added = kept.length ? [`import { ${kept.join(', ')} } from "./api.js"`] : []
  added.push('import { premiumTool } from "./gateway.js"')
  lines.splice(insertAt, 0, ...added)
  return { source: lines.join('\n') }
}

/** The first `{` that opens a function body: the params have closed by then. */
function bodyBraceFrom(source, at) {
  const paren = source.indexOf('(', at)
  if (paren === -1) return -1
  let depth = 0
  for (let i = paren; i < source.length; i++) {
    const c = source[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === '{') {
      if (depth === 0) return i
      depth++
    } else if (c === '}') depth--
  }
  return -1
}

/**
 * Deletes one top-level symbol from a TypeScript file, by name.
 *
 * The compiled text cannot be searched for here - the file is TypeScript, so an
 * annotation or an interface sits between the same characters - and the name is
 * the only thing the two forms share. Plain string searching, no regex, so a
 * symbol called `A2A_TOOLS` cannot be mistaken for a pattern.
 */
function deleteTsSymbol(source, name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return { error: `api: ${name} is not a plain identifier, refusing to delete it` }
  }
  const anchors = [
    { text: `function ${name}(`, expression: false },
    { text: `function ${name} (`, expression: false },
    { text: `function ${name}<`, expression: false },
    { text: `const ${name} =`, expression: true },
    { text: `const ${name}=`, expression: true },
    { text: `interface ${name} `, expression: false },
    { text: `interface ${name}{`, expression: false },
    { text: `type ${name} =`, expression: true },
    { text: `class ${name} `, expression: false },
  ]
  for (const anchor of anchors) {
    const at = source.indexOf(anchor.text)
    if (at === -1) continue
    let start = source.lastIndexOf('\n', at) + 1
    // A doc comment directly above the symbol belongs to it.
    const above = source.slice(0, start)
    const comment = above.lastIndexOf('/**')
    if (comment !== -1 && above.slice(comment).trimEnd().endsWith('*/')) start = comment
    let end
    if (anchor.expression) {
      end = declarationEnd(source, start) - 1
    } else {
      const brace = source.indexOf('{', at + anchor.text.length - 1)
      const body = anchor.text.startsWith('function') ? bodyBraceFrom(source, at) : brace
      end = matchBrace(source, body === -1 ? brace : body)
    }
    if (end === -1) return { error: `api: could not find the end of ${name}` }
    return { source: (source.slice(0, start) + source.slice(end + 1)).replace(/\n{3,}/g, '\n\n') }
  }
  return { error: `api: could not locate ${name} to delete` }
}

/** Deletes several symbols in turn, stopping at the first that cannot be found. */
function deleteSymbols(source, names) {
  let out = source
  for (const name of names) {
    const deleted = deleteTsSymbol(out, name)
    if (deleted.error) return { error: deleted.error }
    out = deleted.source
  }
  return { source: out }
}

/** Adds the new chunk to the generated index, which is the only shared file. */
function updateIndex(slug, constName) {
  const file = path.join(GATEWAY_SRC, 'tools-mcp.js')
  const text = fs.readFileSync(file, 'utf8')
  if (text.includes(`from './tools-mcp-${slug}.js'`)) return
  const lines = text.split('\n')
  const lastImport = lines.findLastIndex((line) => line.startsWith('import '))
  lines.splice(lastImport + 1, 0, `import { ${constName} } from './tools-mcp-${slug}.js'`)
  const closeAt = lines.findLastIndex((line) => line.trim() === ']')
  lines.splice(closeAt, 0, `  ...${constName},`)
  fs.writeFileSync(file, lines.join('\n'))
}

function rewriteReadme(source, packageName, tools) {
  if (!source.includes('<!-- paywall -->')) return source
  const slugs = tools.map((t) => `* \`${t.tool}\``).join('\n')
  const block = [
    '<!-- paywall -->',
    '## Premium tools',
    '',
    'These tools need a licence key:',
    '',
    slugs,
    '',
    `The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at ${BUY_URL} and set it in your MCP client config:`,
    '',
    '```json',
    '"env": { "MCP_LICENSE_KEY": "polar_..." }',
    '```',
    '',
    'The gateway checks the key against Polar and gives every key 1,000 free premium',
    'calls a month before per-call billing starts. Every other tool on this server',
    'stays free.',
    '<!-- /paywall -->',
  ].join('\n')
  const start = source.indexOf('<!-- paywall -->')
  const end = source.indexOf('<!-- /paywall -->')
  if (end === -1) return source
  return source.slice(0, start) + block + source.slice(end + '<!-- /paywall -->'.length)
}

// ---------------------------------------------------------------------------
// Per package
// ---------------------------------------------------------------------------

function ensureDeps(pkgDir) {
  const tsc = path.join(pkgDir, 'node_modules', '.bin', 'tsc')
  if (fs.existsSync(tsc)) return
  execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: pkgDir, stdio: 'pipe' })
}

function build(pkgDir) {
  ensureDeps(pkgDir)
  execFileSync(path.join(pkgDir, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'],
    { cwd: pkgDir, stdio: 'pipe' })
}

async function port(name, { dryRun }) {
  const pkgDir = path.join(SERVERS, name)
  const src = path.join(pkgDir, 'src')
  const log = (...args) => console.log(`[${name}]`, ...args)

  if (!fs.existsSync(src)) return { status: 'SKIP', reason: 'no src directory' }
  const serverPath = path.join(src, 'server.ts')
  const apiPath = path.join(src, 'api.ts')
  if (!fs.existsSync(serverPath) || !fs.existsSync(apiPath)) {
    return { status: 'SKIP', reason: 'no src/server.ts or src/api.ts' }
  }
  if (!fs.existsSync(path.join(src, 'license.ts'))) return { status: 'SKIP', reason: 'not gated' }

  const serverSource = fs.readFileSync(serverPath, 'utf8')
  const apiSource = fs.readFileSync(apiPath, 'utf8')
  const found = premiumFunctions(serverSource)
  if (found.error) return { status: 'SKIP', reason: found.error }

  // Asking the built server for its schemas needs its dependencies, so a package
  // that has never been installed can only be previewed after `npm install`.
  if (!fs.existsSync(path.join(pkgDir, 'node_modules'))) {
    if (dryRun) return { status: 'SKIP', reason: 'dependencies not installed (run with --write)' }
    ensureDeps(pkgDir)
  }

  // The compiled output is what gets ported: no TypeScript to strip by hand.
  if (!fs.existsSync(path.join(pkgDir, 'dist'))) {
    if (dryRun) return { status: 'SKIP', reason: 'not built (run with --write to install and build)' }
    try {
      build(pkgDir)
    } catch (err) {
      return { status: 'SKIP', reason: `build failed: ${String(err.message).slice(0, 120)}` }
    }
  }

  const distApiPath = path.join(pkgDir, 'dist', 'api.js')
  if (!fs.existsSync(distApiPath)) return { status: 'SKIP', reason: 'no dist/api.js' }
  const distApi = fs.readFileSync(distApiPath, 'utf8')
  const all = declarations(distApi)

  const missing = found.tools.filter((t) => !all.has(t.fn))
  if (missing.length) {
    return { status: 'SKIP', reason: `not in dist/api.js: ${missing.map((m) => m.fn).join(', ')}` }
  }
  // A Worker only has the built-ins `nodejs_compat` shims; the rest are absent.
  // The check has to see dynamic imports too: `pingdom-mcp` reached for
  // `await import("node:dns/promises")` inside a body and only failed when called.
  const NODE_BUILTIN = /(?:from|import|require)\s*\(?\s*['"](?:node:)?(?:fs|path|os|child_process|http|https|http2|dns|net|tls|crypto|zlib|stream|url|util|buffer|events|assert|worker_threads|cluster|readline|repl|v8|vm|wasi|perf_hooks|async_hooks|inspector|module|timers|string_decoder|querystring|punycode|domain|constants|process|dgram|tty|sys|diagnostics_channel|trace_events|sea|test|sqlite)['"]/
  if (/process\.env/.test(distApi) || NODE_BUILTIN.test(distApi)) {
    return { status: 'SKIP', reason: 'dist/api.js uses process.env or a node built-in' }
  }

  const ported = closure(all, found.tools.map((t) => t.fn))
  // A ported body that calls an npm package cannot run here: the import statement
  // stays behind in the package, so the name would be undefined on the gateway.
  // `barcode-mcp` reached for `bwip-js` and only failed once it was called.
  const foreign = foreignBindings(distApi, ported)
  if (foreign.length) {
    return { status: 'SKIP', reason: `premium code needs the ${foreign.join(', ')} package on the gateway` }
  }
  const portedNames = new Set(ported.map(([n]) => n))
  const freeRoots = [...all.keys()].filter((n) => !portedNames.has(n))
  const freeClosure = new Set(closure(all, freeRoots).map(([n]) => n))
  const toDelete = ported.filter(([n]) => !freeClosure.has(n))
  const shared = ported.filter(([n]) => freeClosure.has(n)).map(([n]) => n)

  const listed = await listTools(pkgDir)
  if (listed.error) return { status: 'SKIP', reason: `tools/list failed: ${listed.error}` }
  const tools = []
  for (const t of found.tools) {
    const listing = listed.tools.find((x) => x.name === t.tool)
    if (!listing) return { status: 'SKIP', reason: `${t.tool} is not advertised by the built server` }
    if (!listing.inputSchema || typeof listing.inputSchema !== 'object') {
      return { status: 'SKIP', reason: `${t.tool} has no JSON Schema` }
    }
    tools.push({
      ...t,
      gatewayName: `${GATEWAY_TOOL_PREFIX}${name.replace(/-mcp$/, '').replace(/[^a-z0-9]+/gi, '_')}_${t.tool}`,
      description: String(listing.description ?? '').replace(/\s+/g, ' ').trim(),
      inputSchema: { ...listing.inputSchema, additionalProperties: false },
    })
  }

  const slug = name.replace(/-mcp$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const chunkPath = path.join(GATEWAY_SRC, `tools-mcp-${slug}.js`)
  if (fs.existsSync(chunkPath)) return { status: 'SKIP', reason: `${path.basename(chunkPath)} already exists` }

  const chunk = chunkSource(slug, name, ported, tools)
  // The chunk is generated, so it gets parsed before anything is written: a
  // truncated port would otherwise only show up when the suite refused to load.
  const chunkCheck = checkSyntax(chunk)
  if (chunkCheck) return { status: 'SKIP', reason: `generated chunk does not parse: ${chunkCheck}` }
  const nextServer = rewriteServer(serverSource, tools)
  if (nextServer.error) return { status: 'SKIP', reason: nextServer.error }
  const imported = rewriteImports(nextServer.source, tools)
  if (imported.error) return { status: 'SKIP', reason: imported.error }
  const withImports = imported.source
  if (withImports.includes('premiumRequired')) {
    return { status: 'SKIP', reason: 'a premiumRequired call is left in server.ts' }
  }
  // Deleting the closure upsets a file whose helpers are tangled - two packages
  // failed to compile with a stray brace left behind - so the compiler decides:
  // try the full deletion, then fall back to removing only the premium bodies.
  const attempts = []
  const closureDelete = deleteSymbols(apiSource, toDelete.map(([symbol]) => symbol))
  if (closureDelete.error) log(`closure deletion refused: ${closureDelete.error}`)
  else {
    attempts.push({
      label: 'closure',
      source: closureDelete.source,
      deleted: toDelete.map(([symbol]) => symbol),
    })
  }
  const bodyOnly = deleteSymbols(apiSource, tools.map((t) => t.fn))
  if (bodyOnly.error) log(`premium-body deletion refused: ${bodyOnly.error}`)
  else if (!closureDelete.source || bodyOnly.source !== closureDelete.source) {
    attempts.push({ label: 'bodies-only', source: bodyOnly.source, deleted: tools.map((t) => t.fn) })
  }
  if (!attempts.length) return { status: 'SKIP', reason: 'api.ts could not be edited' }
  const readmePath = path.join(pkgDir, 'README.md')
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : ''
  const nextReadme = rewriteReadme(readme, name, tools)

  log(`premium: ${tools.map((t) => `${t.tool} -> ${t.gatewayName}()`).join(', ')}`)
  log(`ported ${ported.length} symbol(s); deleting ${toDelete.length}; shared with free tools: ${shared.length ? shared.join(', ') : 'none'}`)
  if (shared.length) log(`WARNING shared helper kept in the package: ${shared.join(', ')}`)
  log(`chunk -> ${path.relative(process.cwd(), chunkPath)}`)
  if (dryRun) return { status: 'DRY', tools: tools.length }

  // Every path this run touches is remembered first, so a package that fails a
  // later step is put back exactly as it was rather than left half-migrated.
  const indexPath = path.join(GATEWAY_SRC, 'tools-mcp.js')
  const touched = [chunkPath, indexPath, path.join(src, 'gateway.ts'), serverPath, apiPath,
    readmePath, path.join(src, 'license.ts'), path.join(pkgDir, 'dist', 'license.js')]
  const backups = touched.map((p) => [p, fs.existsSync(p) ? fs.readFileSync(p) : null])
  const rollback = () => {
    for (const [p, content] of backups) {
      if (content === null) fs.rmSync(p, { force: true })
      else fs.writeFileSync(p, content)
    }
    try {
      build(pkgDir)
    } catch {
      // A failed rebuild after a rollback would be a second problem; the source is
      // back either way, which is what matters.
    }
  }

  fs.writeFileSync(chunkPath, chunk)
  updateIndex(slug, constNameFor(slug))
  fs.writeFileSync(path.join(src, 'gateway.ts'), GATEWAY_CLIENT)
  fs.writeFileSync(serverPath, withImports)
  if (nextReadme !== readme) fs.writeFileSync(readmePath, nextReadme)
  fs.rmSync(path.join(src, 'license.ts'))
  fs.rmSync(path.join(pkgDir, 'dist', 'license.js'), { force: true })

  let lastFailure = 'no attempt built'
  for (const attempt of attempts) {
    fs.writeFileSync(apiPath, attempt.source)
    try {
      build(pkgDir)
    } catch (err) {
      lastFailure = [err.stderr, err.stdout, err.message]
        .map((part) => String(part ?? ''))
        .join('\n').split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 4).join(' | ')
      continue
    }
    // The whole point: the premium bodies must be gone from what ships.
    const leftovers = []
    for (const t of tools) {
      for (const file of fs.readdirSync(path.join(pkgDir, 'dist'))) {
        if (!file.endsWith('.js')) continue
        const text = fs.readFileSync(path.join(pkgDir, 'dist', file), 'utf8')
        if (new RegExp(`function\\s+${t.fn}\\b`).test(text)) leftovers.push(`${file}:${t.fn}`)
      }
    }
    if (leftovers.length) {
      lastFailure = `still shipping ${leftovers.join(', ')}`
      continue
    }
    if (attempt.label !== 'closure') {
      log(`NOTE only the premium bodies could be deleted; api.ts still holds code nothing calls: ${attempt.deleted.join(', ')}`)
    }
    log('verified: premium bodies absent from dist')
    return { status: 'PORTED', tools: tools.length, chunk: path.basename(chunkPath),
      cleanup: attempt.label !== 'closure' }
  }

  rollback()
  return { status: 'BROKEN', reason: `no deletion compiled, package restored: ${lastFailure}` }
}

// The pieces above are exported so a one-off repair can reuse them instead of
// reimplementing the scanner: a chunk regenerated by the same logic is a chunk
// that matches every other chunk.
export { callArguments, chunkSource, closure, constNameFor, declarations, listTools, premiumFunctions }

export async function main() {
  const targets = names().slice(0, limit === Infinity ? undefined : limit)
  if (!targets.length) {
    console.error('nothing to do: pass package names or --list <file.json>')
    process.exit(2)
  }
  const results = []
  for (const name of targets) {
    try {
      results.push([name, await port(name, { dryRun: !write })])
    } catch (err) {
      results.push([name, { status: 'ERROR', reason: String(err.stack ?? err).slice(0, 300) }])
    }
  }
  console.log('\n==== summary ====')
  for (const [name, r] of results) console.log(`${r.status.padEnd(7)} ${name}${r.reason ? ' - ' + r.reason : ''}`)
  const count = (s) => results.filter(([, r]) => r.status === s).length
  console.log(`ported ${count('PORTED')} | dry-run ${count('DRY')} | skipped ${count('SKIP')} | broken ${count('BROKEN')} | errors ${count('ERROR')}`)
}

// Importing this file for its helpers must not start a migration.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  await main()
}

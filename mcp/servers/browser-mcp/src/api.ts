import { spawn, ChildProcess } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

export class BrowserError extends Error {}

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].filter(Boolean) as string[]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  throw new BrowserError("Chrome not found. Install Chrome or set CHROME_PATH.")
}

interface CdpTarget {
  id: string
  type: string
  title: string
  url: string
  webSocketDebuggerUrl?: string
}

interface Pending {
  resolve: (v: any) => void
  reject: (e: Error) => void
}

class CdpSession {
  private ws?: WebSocket
  private seq = 0
  private pending = new Map<number, Pending>()
  constructor(private url: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      this.ws.onopen = () => resolve()
      this.ws.onerror = (e: any) => reject(new BrowserError(`CDP connect failed: ${e?.message ?? "unknown"}`))
      this.ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string)
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)!
          this.pending.delete(msg.id)
          if (msg.error) reject(new BrowserError(msg.error.message))
          else resolve(msg.result)
        }
      }
    })
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.seq
      this.pending.set(id, { resolve, reject })
      this.ws?.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new BrowserError(`CDP timeout on ${method}`))
        }
      }, 30000)
    })
  }

  close() {
    try { this.ws?.close() } catch { /* ignore */ }
  }
}

interface Page {
  child: ChildProcess
  profile: string
  port: string
  session: CdpSession
}

async function launch(): Promise<Page> {
  const chrome = findChrome()
  const profile = mkdtempSync(join(tmpdir(), "browser-mcp-"))
  const child = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" })
  const portFile = join(profile, "DevToolsActivePort")
  let port = ""
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 200))
    if (existsSync(portFile)) {
      try { port = readFileSync(portFile, "utf8").split("\n")[0].trim(); break } catch { /* retry */ }
    }
  }
  if (!port) throw new BrowserError("Chrome did not open a debugging port")
  let wsUrl = ""
  for (let i = 0; i < 50 && !wsUrl; i++) {
    await new Promise((r) => setTimeout(r, 200))
    try {
      const targets = (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(10000) }).then((r) => r.json())) as CdpTarget[]
      const page = targets.find((t) => t.type === "page")
      wsUrl = page?.webSocketDebuggerUrl ?? ""
    } catch {
      /* Chrome still starting */
    }
  }
  if (!wsUrl) throw new BrowserError("Chrome opened no page target for CDP")
  const session = new CdpSession(wsUrl)
  await session.connect()
  return { child, profile, port, session }
}

function cleanup(page: Page) {
  try { page.session.close() } catch { /* ignore */ }
  try { page.child.kill("SIGKILL") } catch { /* ignore */ }
  try { rmSync(page.profile, { recursive: true, force: true }) } catch { /* ignore */ }
}

async function navigate(page: Page, url: string): Promise<void> {
  await page.session.send("Page.enable")
  const load = new Promise<void>((resolve) => {
    const started = Date.now()
    const timer = setInterval(async () => {
      try {
        const res = await page.session.send("Runtime.evaluate", { expression: "document.readyState", returnByValue: true })
        if (res?.result?.value === "complete" || Date.now() - started > 25000) {
          clearInterval(timer)
          resolve()
        }
      } catch {
        clearInterval(timer)
        resolve()
      }
    }, 400)
  })
  await page.session.send("Page.navigate", { url })
  await load
}

async function evalJs(page: Page, expression: string): Promise<string> {
  const res = await page.session.send("Runtime.evaluate", { expression, returnByValue: true })
  return res?.result?.value ?? ""
}

export async function openPage(args: { url?: string }): Promise<string> {
  const url = args.url ?? ""
  if (!/^https?:\/\//i.test(url)) throw new BrowserError("Provide a full http or https URL")
  const page = await launch()
  try {
    await navigate(page, url)
    const title = await evalJs(page, "document.title")
    const text = await evalJs(page, "(document.body ? document.body.innerText : '').slice(0, 3000)")
    const finalUrl = await evalJs(page, "location.href")
    return `Title: ${title || "(no title)"}\nURL: ${finalUrl}\n\n${text.slice(0, 3000)}`
  } finally {
    cleanup(page)
  }
}

export async function screenshotPage(args: { url?: string }): Promise<string> {
  const url = args.url ?? ""
  if (!/^https?:\/\//i.test(url)) throw new BrowserError("Provide a full http or https URL")
  const page = await launch()
  try {
    await navigate(page, url)
    const shot = await page.session.send("Page.captureScreenshot", { format: "png" })
    const b64: string = shot?.data ?? ""
    if (!b64) throw new BrowserError("No screenshot data returned")
    const out = join(tmpdir(), `browser-mcp-shot-${randomUUID().slice(0, 8)}.png`)
    writeFileSync(out, Buffer.from(b64, "base64"))
    return `Saved screenshot to ${out} (${Buffer.from(b64, "base64").length} bytes)`
  } finally {
    cleanup(page)
  }
}

// ---- muxA tools:

/**
 * The two original tools connect straight to a page target's WebSocket, which
 * current Chrome leaves hanging on Page.navigate. These helpers drive Chrome
 * over the browser endpoint instead, and open each URL in a fresh tab. A new
 * tab starts life on the requested document, which avoids the cross-document
 * navigation that otherwise leaves Runtime.evaluate answering for the old page.
 */
interface Tab {
  context: number
  session: (method: string, params?: Record<string, unknown>) => Promise<any>
  close: () => Promise<void>
}

interface Browser {
  openTab: (url: string) => Promise<Tab>
  stop: () => void
}

interface Visited {
  done: () => Promise<void>
  value: (expression: string) => Promise<string>
  finalUrl: string
}

async function attachToPage(): Promise<Browser> {
  const chrome = findChrome()
  const profile = mkdtempSync(join(tmpdir(), "browser-mcp-cdp-"))
  const child = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" })

  const kill = () => {
    try { child.kill("SIGKILL") } catch { /* ignore */ }
    try { rmSync(profile, { recursive: true, force: true }) } catch { /* ignore */ }
  }

  const portFile = join(profile, "DevToolsActivePort")
  let port = ""
  for (let i = 0; i < 75; i++) {
    await new Promise((r) => setTimeout(r, 200))
    if (existsSync(portFile)) {
      try { port = readFileSync(portFile, "utf8").split("\n")[0].trim(); break } catch { /* retry */ }
    }
  }
  if (!port) {
    kill()
    throw new BrowserError("Chrome did not open a debugging port")
  }

  const version = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(10000) })
    .then((r) => r.json()) as { webSocketDebuggerUrl?: string }
  if (!version.webSocketDebuggerUrl) {
    kill()
    throw new BrowserError("Chrome exposed no browser WebSocket")
  }

  const ws = new WebSocket(version.webSocketDebuggerUrl)
  const pending = new Map<number, (msg: any) => void>()
  const contextWaiters: Array<(id: number) => void> = []
  // executionContextCreated is broadcast for every session, so only the tab we
  // just attached to may satisfy a waiter
  let contextFilter: string | null = null
  let defaultContext = 0
  let seq = 0

  const flushWaiters = () => {
    while (contextWaiters.length) {
      const waiter = contextWaiters.shift()
      if (waiter) waiter(defaultContext)
    }
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data)) as any
    if (msg.id && pending.has(msg.id)) {
      const done = pending.get(msg.id)
      pending.delete(msg.id)
      if (done) done(msg)
      return
    }
    if (
      msg.method === "Runtime.executionContextCreated" &&
      msg.params?.context?.auxData?.isDefault &&
      (contextFilter === null || msg.sessionId === contextFilter)
    ) {
      defaultContext = msg.params.context.id as number
      const waiter = contextWaiters.shift()
      if (waiter) waiter(defaultContext)
    }
  }
  ws.onclose = flushWaiters
  ws.onerror = flushWaiters

  try {
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      const failed = () => reject(new BrowserError("Could not open the Chrome DevTools WebSocket"))
      ws.addEventListener("error", failed, { once: true })
    })
  } catch (e) {
    kill()
    throw e
  }

  const raw = (method: string, params: Record<string, unknown>, sessionId?: string) =>
    new Promise<any>((resolve, reject) => {
      const id = ++seq
      pending.set(id, resolve)
      const message: Record<string, unknown> = { id, method, params }
      if (sessionId) message.sessionId = sessionId
      ws.send(JSON.stringify(message))
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id)
          reject(new BrowserError(`CDP timeout on ${method}`))
        }
      }, 30000)
    })

  const stop = () => {
    try { ws.close() } catch { /* ignore */ }
    kill()
  }

  const waitForContext = (timeoutMs: number) =>
    new Promise<number>((resolve) => {
      if (defaultContext) {
        resolve(defaultContext)
        return
      }
      const timer = setTimeout(() => resolve(0), timeoutMs)
      contextWaiters.push((id) => {
        clearTimeout(timer)
        resolve(id)
      })
    })

  const targets = await raw("Target.getTargets", {})
  const page = (targets.result?.targetInfos ?? []).find((t: { type: string }) => t.type === "page")
  if (!page) {
    stop()
    throw new BrowserError("Chrome opened no page target")
  }
  const attached = await raw("Target.attachToTarget", { targetId: page.targetId, flatten: true })
  const sessionId = attached.result?.sessionId
  if (!sessionId) {
    stop()
    throw new BrowserError(`Could not attach to the page: ${attached.error?.message ?? "no session"}`)
  }
  const session = (method: string, params: Record<string, unknown> = {}) => raw(method, params, sessionId)

  return {
    // Target.createTarget ignores its url in headless=new, and pinning an
    // execution context makes Page.navigate hang, so this is the one flow that
    // works: attach the page Chrome already opened, then navigate it.
    openTab: async (url: string): Promise<Tab> => {
      await session("Page.enable")
      const nav = await session("Page.navigate", { url })
      if (nav?.error) throw new BrowserError(`Chrome refused to navigate: ${nav.error.message}`)
      await new Promise((r) => setTimeout(r, 3000))
      return {
        context: 0,
        session,
        close: async () => undefined,
      }
    },
    stop,
  }
}

/**
 * A CDP command answers as { id, result: <domain result> }, and Runtime.evaluate
 * puts the RemoteObject one level deeper still, so the value lives at
 * result.result.value. Reading result.value alone silently yields undefined.
 */
function remoteValue(message: any): string {
  const value = message?.result?.result?.value
  return value == null ? "" : String(value)
}

function remoteError(message: any): string {
  const details = message?.result?.exceptionDetails
  if (!details) return ""
  return details.exception?.description ?? details.text ?? "the script threw"
}

function requireUrl(url: string): string {
  const u = (url ?? "").trim()
  if (!/^https?:\/\//i.test(u)) throw new BrowserError("Provide a full http or https URL")
  return u
}

async function visit(url: string): Promise<Visited> {
  const browser = await attachToPage()
  let tab: Tab | null = null
  const done = async () => {
    if (tab) await tab.close()
    browser.stop()
  }
  try {
    tab = await browser.openTab(url)
    for (let i = 0; i < 80; i++) {
      await new Promise((r) => setTimeout(r, 250))
      try {
        const res = await tab.session("Runtime.evaluate", {
          ...(tab.context ? { contextId: tab.context } : {}),
          expression: "document.readyState",
          returnByValue: true,
        })
        if (remoteValue(res) === "complete") break
      } catch {
        break
      }
    }
    const active = tab
    const value = async (expression: string) => {
      const res = await active.session("Runtime.evaluate", {
        ...(active.context ? { contextId: active.context } : {}),
        expression,
        returnByValue: true,
        awaitPromise: true,
      })
      const failure = remoteError(res)
      if (failure) throw new BrowserError(failure)
      return remoteValue(res)
    }
    return { done, value, finalUrl: await value("location.href") }
  } catch (e) {
    await done()
    throw e
  }
}

function summarise(value: string, max: number): string {
  const text = value.replace(/\r/g, "")
  return text.length > max ? `${text.slice(0, max)}\n...truncated at ${max} characters.` : text
}

export async function pageLinks(args: { url?: string; limit?: number }): Promise<string> {
  const url = requireUrl(args.url ?? "")
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 40), 200))
  const { done, value, finalUrl } = await visit(url)
  try {
    const title = await value("document.title || ''")
    const links = JSON.parse(
      (await value(
        `JSON.stringify(Array.from(document.querySelectorAll('a[href]')).map(a => ({ href: a.href, text: (a.innerText || a.textContent || '').trim() })).filter(l => /^https?:/.test(l.href)))`,
      )) || "[]",
    ) as Array<{ href: string; text: string }>
    if (!links.length) {
      return `${title || "(untitled page)"} at ${finalUrl} has no absolute links. It may be a frameset, a script-rendered app, or genuinely link free.`
    }
    const hosts = [...new Set(links.map((l) => { try { return new URL(l.href).host } catch { return '' } }))].filter(Boolean)
    return [
      `${title || "(untitled page)"} — ${links.length} absolute link(s) to ${hosts.length} host(s), showing ${Math.min(links.length, limit)}.`,
      `Final URL: ${finalUrl}`,
      ...links.slice(0, limit).map((l, i) => `${i + 1}. ${summarise(l.text || "(no anchor text)", 70)} | ${l.href}`),
      links.length > limit ? `...and ${links.length - limit} more links.` : '',
    ]
      .filter(Boolean)
      .join('\n')
  } finally {
    await done()
  }
}

export async function pageHeadings(args: { url?: string; limit?: number }): Promise<string> {
  const url = requireUrl(args.url ?? "")
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 60), 300))
  const { done, value, finalUrl } = await visit(url)
  try {
    const title = await value("document.title || ''")
    const headings = JSON.parse(
      (await value(
        `JSON.stringify(Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).slice(0, 500).map(h => ({ level: Number(h.tagName.slice(1)), text: (h.innerText || '').trim() })).filter(h => h.text))`,
      )) || "[]",
    ) as Array<{ level: number; text: string }>
    if (!headings.length) return `${title || "(untitled page)"} at ${finalUrl} has no heading elements.`
    const shown = headings.slice(0, limit)
    const counts = new Map<number, number>()
    for (const h of headings) counts.set(h.level, (counts.get(h.level) ?? 0) + 1)
    return [
      `Heading outline of ${title || "(untitled page)"}: ${headings.length} heading(s), levels ${[...counts.keys()].sort().map((l) => `h${l}x${counts.get(l)}`).join(' ')}.`,
      `URL: ${finalUrl}`,
      ...shown.map((h) => `${'  '.repeat(Math.max(0, h.level - 1))}h${h.level} ${summarise(h.text, 90)}`),
      headings.length > shown.length ? `...and ${headings.length - shown.length} more heading(s).` : '',
    ]
      .filter(Boolean)
      .join('\n')
  } finally {
    await done()
  }
}

export async function runScript(args: { url?: string; script?: string }): Promise<string> {
  const url = requireUrl(args.url ?? "")
  const script = (args.script ?? "").trim()
  if (!script) throw new BrowserError("Provide the JavaScript expression to run in the page")
  const { done, value, finalUrl } = await visit(url)
  try {
    const result = await value(script)
    return [
      `Ran JavaScript on ${finalUrl}`,
      `Expression: ${summarise(script, 300)}`,
      result === ''
        ? 'Result: the expression produced no value (it returned undefined).'
        : `Result: ${summarise(result, 3000)}`,
    ].join('\n')
  } finally {
    await done()
  }
}

// ---- gap4e1 tools:


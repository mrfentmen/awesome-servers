/**
 * Gopher protocol client — talks raw TCP (port 70) to gopher servers.
 *
 * Gopher is the pre-HTTP internet: servers publish hierarchical menus of
 * typed items (directories, text files, search services, binaries).
 * A request is just `selector\r\n`; the response is items separated by
 * CRLF, terminated by a line containing only ".". Text files come back
 * raw (type 0), menus as type-tagged items (type 1).
 *
 * Item line format:
 *   TYPEdisplay-text<TAB>selector<TAB>host<TAB>port
 */
import { connect } from "node:net"
import type { Socket } from "node:net"

export const DEFAULT_GHOST = "gopher.floodgap.com"
export const DEFAULT_PORT = 70

export class GopherError extends Error {}

// Item types per RFC 1436 / common usage.
const TYPE_LABEL: Record<string, string> = {
  "0": "text",
  "1": "dir",
  "2": "cso", // phone-book / CSO search
  "3": "error",
  "4": "binhex",
  "5": "dos",
  "6": "uuencode",
  "7": "search",
  "8": "telnet",
  "9": "binary",
  g: "gif",
  h: "html",
  I: "image",
  i: "info",
  s: "sound",
  ":": "image",
  "<": "html",
}

export interface GopherItem {
  type: string
  label: string
  selector: string
  host: string
  port: number
  info?: boolean // informational line (type 'i'), not a link
  error?: boolean
}

/**
 * Open a gopher connection, send `selector`, and read the full response.
 * Returns the raw body with the trailing ".\r\n" terminator removed.
 */
export function gopherFetch(
  host: string,
  selector: string,
  port = DEFAULT_PORT,
  timeoutMs = 10000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const sock: Socket = connect({ host, port })
    let buf = ""
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      sock.destroy()
      reject(new GopherError(`Timed out after ${timeoutMs}ms on gopher://${host}:${port}/${selector}`))
    }, timeoutMs)

    sock.setEncoding("latin1")
    sock.on("connect", () => {
      sock.write(selector + "\r\n")
    })
    sock.on("data", (chunk: string) => {
      buf += chunk
    })
    sock.on("end", () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(buf)
    })
    sock.on("error", (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      sock.destroy()
      reject(new GopherError(`Gopher connection to ${host}:${port} failed: ${err.message}`))
    })
  })
}

/** Drop the gopher trailing terminator line (".") and CRLF noise. */
export function stripTerminator(body: string): string {
  const lines = body.split(/\r?\n/)
  // A gopher response ends with a line containing only "." (CRLF-terminated).
  while (lines.length > 0 && lines[lines.length - 1].trim() === ".") {
    lines.pop()
  }
  return lines.join("\n")
}

/**
 * Parse a raw gopher response into structured items (menu mode).
 * `requestHost` is used as the fallback for items whose host field is
 * empty (RFC 1436: empty host means the same host we queried).
 */
export function parseMenu(body: string, requestHost = DEFAULT_GHOST): GopherItem[] {
  const items: GopherItem[] = []
  for (const rawLine of stripTerminator(body).split("\n")) {
    const line = rawLine.trimEnd()
    if (!line) continue
    const type = line[0] ?? ""
    const rest = line.slice(1)
    const [label, selector = "", host = "", portStr = ""] = rest.split("\t")
    const port = parseInt(portStr, 10) || DEFAULT_PORT
    if (type === "i") {
      items.push({ type: "i", label, selector, host: host || requestHost, port, info: true })
      continue
    }
    items.push({
      type,
      label: label ?? "",
      selector,
      host: host || requestHost,
      port,
      error: type === "3",
    })
  }
  return items.filter((it) => !(it.type === "i" && !it.label))
}

/** Drop the gopher trailing "." and CRLF noise for plain-text reads. */
export function cleanText(body: string): string {
  return stripTerminator(body)
}

export function formatItem(it: GopherItem, index: number): string {
  const kind = TYPE_LABEL[it.type] ?? it.type
  if (it.info) return `${index + 1}. ${it.label}`
  if (it.error) return `   ⚠ ${it.label}`
  const nav =
    it.type === "1"
      ? ` [dir → gopher://${it.host}:${it.port}/${it.selector}]`
      : it.type === "7"
        ? ` [search on ${it.host}]`
        : it.type === "0" || it.type === "h"
          ? ` [gopher://${it.host}:${it.port}/${it.selector}]`
          : ` [${kind}: ${it.host}:${it.port}/${it.selector}]`
  return `${index + 1}. [${kind}] ${it.label}${nav}`
}

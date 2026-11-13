import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function popcount(value: number): number {
  let count = 0
  let n = value
  while (n > 0) {
    count += n & 1
    n >>>= 1
  }
  return count
}

function hex(value: number, width: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(width, "0")}`
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const counts = { CMD: 0, DATA: 0, STATUS: 0 }

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return

    const match = /^(CMD|DATA|STATUS)\s*[:,]?\s*(0x[0-9A-Fa-f]+|[0-9A-Fa-f]+)$/i.exec(line)
    if (!match) {
      issues.push({ code: "bad-line", severity: "error", message: `Line must be CMD/DATA/STATUS plus a hex word: ${line.slice(0, 40)}`, line: number })
      return
    }

    const kind = match[1].toUpperCase() as "CMD" | "DATA" | "STATUS"
    const token = match[2].replace(/^0x/i, "")
    const value = Number.parseInt(token, 16)
    if (!Number.isFinite(value) || value > 0xfffff) {
      issues.push({ code: "bad-word", severity: "error", message: `Word is wider than 20 bits: ${match[2]}`, line: number })
      return
    }
    if (token.length > 5) {
      issues.push({ code: "bad-width", severity: "warning", message: `Word has more than 5 hex digits: ${match[2]}`, line: number })
      return
    }
    counts[kind] += 1

    const parity = value & 1
    const parityOk = (popcount(value & 0xffffe) + parity) % 2 === 1
    if (!parityOk) {
      issues.push({ code: "parity", severity: "warning", message: `Odd parity fails for ${kind} ${hex(value, 5)}`, line: number })
    }

    if (kind === "CMD") {
      const sync = (value >>> 17) & 0x7
      const rt = (value >>> 12) & 0x1f
      const tr = (value >>> 11) & 0x1
      const sub = (value >>> 6) & 0x1f
      const wc = (value >>> 1) & 0x1f
      if (sync !== 0b001) {
        issues.push({ code: "bad-sync", severity: "warning", message: `Command sync is ${sync.toString(2)}, expected 001`, line: number })
      }
      if (rt === 31) {
        issues.push({ code: "broadcast-rt", severity: "warning", message: "RT address 31 means broadcast mode", line: number })
      }
      if (sub === 0 || sub === 31) {
        issues.push({ code: "reserved-subaddress", severity: "warning", message: `Subaddress ${sub} is reserved for mode codes`, line: number })
      }
      if (wc === 0) {
        issues.push({ code: "zero-word-count", severity: "warning", message: "Word count 0 means 32 words on the wire", line: number })
      }
      records.push({
        id: `cmd:${number}`,
        kind: "command",
        fields: { word: hex(value, 5), rt, tr: tr === 1 ? "receive" : "transmit", subaddress: sub, wordCount: wc === 0 ? 32 : wc, parityOk, line: number },
      })
      return
    }

    if (kind === "STATUS") {
      const rt = (value >>> 12) & 0x1f
      records.push({ id: `status:${number}`, kind: "status", fields: { word: hex(value, 5), rt, parityOk, line: number } })
      return
    }

    records.push({
      id: `data:${number}`,
      kind: "data",
      fields: { word: hex(value, 5), value: (value >>> 1) & 0xffff, parityOk, line: number },
    })
  })

  if (counts.CMD === 0) {
    issues.push({ code: "no-command", severity: "error", message: "No CMD word found; a message needs a command word" })
  }

  return {
    format: "MIL-STD-1553",
    records,
    meta: { commands: counts.CMD, data: counts.DATA, status: counts.STATUS, words: records.length },
    issues,
  }
}

const reference = [
  "MIL-STD-1553 word",
  "",
  "One word per line: CMD 0x1C2F, DATA 0x1234, STATUS 0x9A01.",
  "Command word, MSB first, 20 bits:",
  "  bits 1-3    sync, always 001",
  "  bits 4-8    RT address (0-30, 31 is broadcast)",
  "  bit 9       T/R: 1 receive, 0 transmit",
  "  bits 10-14  subaddress (0 and 31 are mode codes)",
  "  bits 15-19  word count (0 means 32)",
  "  bit 20      odd parity",
  "Status word has the same sync and RT address layout.",
].join("\n")

export const format: FormatModule = {
  slug: "mil-std-1553",
  displayName: "MIL-STD-1553",
  extensions: [".1553", ".mil1553", ".txt"],
  description: "Decode MIL-STD-1553 command, data and status words.",
  reference,
  parse,
  sample: () =>
    [
      "# command: sync 001, RT 5, transmit, subaddress 2, 4 words",
      "CMD 0xE9A09",
      "DATA 0x12345",
      "STATUS 0xD0A01",
    ].join("\n") + "\n",
}

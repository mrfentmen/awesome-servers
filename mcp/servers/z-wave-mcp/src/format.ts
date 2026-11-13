import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function bytesOf(line: string): number[] | null {
  const tokens = line.replace(/0x/gi, "").split(/[\s,;]+/).filter(Boolean)
  const bytes: number[] = []
  for (const token of tokens) {
    if (!/^[0-9a-f]{2}$/i.test(token)) return null
    bytes.push(parseInt(token, 16))
  }
  return bytes
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  let totalBytes = 0

  lines.forEach((raw, index) => {
    const number = index + 1
    const bytes = bytesOf(raw.trim())
    if (!bytes || bytes.length === 0) {
      issues.push({ code: "bad-hex", severity: "error", message: `Line is not hex bytes: ${raw.trim().slice(0, 30)}`, line: number })
      return
    }

    if (bytes[0] !== 0x01) {
      issues.push({ code: "bad-sof", severity: "error", message: `Frame must start with 0x01, found 0x${bytes[0].toString(16)}`, line: number })
      return
    }
    if (bytes.length < 5) {
      issues.push({ code: "short-frame", severity: "error", message: "Frame needs at least 5 bytes", line: number })
      return
    }

    const declared = bytes[1]
    if (declared !== bytes.length - 1) {
      issues.push({ code: "bad-length", severity: "error", message: `Length byte says ${declared}, frame has ${bytes.length - 1}`, line: number })
    }

    let checksum = 0
    for (const byte of bytes.slice(1, -1)) checksum ^= byte
    const expected = 0xff ^ checksum
    if (bytes[bytes.length - 1] !== expected) {
      issues.push({
        code: "bad-checksum",
        severity: "error",
        message: `Checksum is 0x${bytes[bytes.length - 1].toString(16).padStart(2, "0")}, expected 0x${expected.toString(16).padStart(2, "0")}`,
        line: number,
      })
    }

    totalBytes += bytes.length
    records.push({
      id: `frame:${number}`,
      kind: "frame",
      fields: {
        length: declared,
        commandClass: bytes[4] ?? 0,
        command: bytes[5] ?? 0,
        bytes: bytes.length,
        line: number,
      },
    })
  })

  if (records.length === 0) {
    issues.push({ code: "no-frames", severity: "error", message: "Input has no Z-Wave frame" })
  }

  return {
    format: "Z-Wave",
    records,
    meta: {
      frames: records.length,
      bytes: totalBytes,
      commandClasses: new Set(records.map((record) => record.fields.commandClass)).size,
    },
    issues,
  }
}

const reference = [
  "Z-Wave frame (hex)",
  "",
  "01 0A 00 04 01 03 25 03 FF 00 2A",
  "",
  "Byte 0 is SOF and must be 0x01.",
  "Byte 1 is the length: the number of bytes after it.",
  "Byte 2 is the frame type, then the payload.",
  "The last byte is the checksum: XOR of bytes 1..n-1 must be 0xFF.",
  "One frame per line, hex pairs with or without 0x.",
].join("\n")

export const format: FormatModule = {
  slug: "z-wave",
  displayName: "Z-Wave",
  extensions: [".zwave", ".hex"],
  description: "Parse Z-Wave hex frames, validate SOF, length and checksum.",
  reference,
  parse,
  regressions: [{ doc: "01 0A 00 04 01 03 25 03 FF 00 21\n", expectError: "Checksum is" }],
  sample: () => "01 0A 00 04 01 03 25 03 FF 00 2A\n",
}

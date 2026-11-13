import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ADDRESS_BYTES: Record<string, number> = { "0": 2, "1": 2, "2": 3, "3": 4, "5": 2, "6": 3, "7": 4, "8": 3, "9": 2 }

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let dataRecords = 0
  let dataBytes = 0
  let startAddress = 0
  let sawHeader = false
  let termination = 0

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  lines.forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line) return
    if (!/^S[0-9A-Fa-f]/.test(line)) {
      issues.push({ code: "bad-record", severity: "error", message: "S-record must start with S and a type digit", line: lineNo })
      return
    }
    const type = line[1]
    const hex = line.slice(2)
    if (!/^[0-9A-Fa-f]+$/.test(hex) || hex.length % 2 !== 0) {
      issues.push({ code: "bad-hex", severity: "error", message: "Record body must be an even number of hex digits", line: lineNo })
      return
    }
    const bytes = (hex.match(/../g) ?? []).map((pair) => Number.parseInt(pair, 16))
    const count = bytes[0] ?? -1
    if (bytes.length !== count + 1) {
      issues.push({ code: "bad-count", severity: "error", message: `Count byte says ${count} bytes after the count, found ${bytes.length - 1}`, line: lineNo })
      return
    }
    const addressBytes = ADDRESS_BYTES[type]
    if (!addressBytes) {
      issues.push({ code: "bad-type", severity: "error", message: `Unsupported S-record type S${type}`, line: lineNo })
      return
    }
    if (count < addressBytes + 1) {
      issues.push({ code: "short-record", severity: "error", message: `S${type} record is too short for its address`, line: lineNo })
      return
    }
    const address = bytes.slice(1, 1 + addressBytes).reduce((sum, byte) => sum * 256 + byte, 0)
    const payload = bytes.slice(1 + addressBytes, bytes.length - 1)
    const checksum = bytes[bytes.length - 1]
    const sum = bytes.reduce((total, byte) => total + byte, 0)
    if ((sum & 0xff) !== 0xff) {
      issues.push({ code: "bad-checksum", severity: "error", message: `Checksum mismatch: sum ends in ${(sum & 0xff).toString(16)}`, line: lineNo })
    }
    if (termination !== 0 && ["1", "2", "3"].includes(type)) {
      issues.push({ code: "data-after-end", severity: "error", message: "Data record after the termination record", line: lineNo })
    }
    if (type === "0") sawHeader = true
    if (["1", "2", "3"].includes(type)) {
      dataRecords += 1
      dataBytes += payload.length
    }
    if (["5", "6"].includes(type) && address !== dataRecords) {
      issues.push({ code: "bad-data-count", severity: "error", message: `S${type} counts ${address} data records, found ${dataRecords}`, line: lineNo })
    }
    if (["7", "8", "9"].includes(type)) {
      termination = Number(type)
      startAddress = address
    }
    records.push({
      id: `srec:${records.length + 1}`,
      kind: `s${type}`,
      fields: { type: `S${type}`, count, address, dataBytes: payload.length, checksum, termination: ["7", "8", "9"].includes(type) },
    })
  })

  if (!sawHeader) issues.push({ code: "no-header", severity: "warning", message: "No S0 header record" })
  if (termination === 0) issues.push({ code: "no-termination", severity: "error", message: "Missing S7, S8 or S9 termination record" })
  if (dataRecords === 0) issues.push({ code: "no-data", severity: "error", message: "File has no data records" })

  return {
    format: "S-record",
    records,
    meta: { records: records.length, dataRecords, dataBytes, startAddress, termination: termination ? `S${termination}` : "none" },
    issues,
  }
}

const reference = [
  "Motorola S-record",
  "",
  "S0 06 0000 484452 1B",
  "S1 13 0000 000102030405060708090A0B0C0D0E0F 74",
  "S9 03 0000 FC",
  "",
  "Each record is S + type + count + address + data + checksum.",
  "The count byte covers address, data and checksum bytes.",
  "All bytes after the type, including the checksum, must sum to 0xFF.",
  "Data records are S1 (16-bit), S2 (24-bit) and S3 (32-bit).",
  "S7, S8 or S9 ends the file and carries the start address.",
].join("\n")

export const format: FormatModule = {
  slug: "srec",
  displayName: "S-record",
  extensions: [".srec", ".s19", ".s28", ".s37", ".mot"],
  description: "Parse Motorola S-records, validate counts, addresses and checksums.",
  reference,
  parse,
  sample: () =>
    ["S00600004844521B", "S1130000000102030405060708090A0B0C0D0E0F74", "S9030000FC"].join("\n") + "\n",
}

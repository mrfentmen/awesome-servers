import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function reverseByte(value: number): number {
  let out = 0
  for (let bit = 0; bit < 8; bit += 1) {
    if ((value >> bit) & 1) out |= 1 << (7 - bit)
  }
  return out
}

function popcount(value: number): number {
  let count = 0
  let n = value
  while (n > 0) {
    count += n & 1
    n >>>= 1
  }
  return count
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const labels = new Map<number, number>()

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return

    const token = line.split(/[\s,]+/)[0].replace(/^0x/i, "")
    if (!/^[0-9A-Fa-f]{8}$/.test(token)) {
      issues.push({ code: "bad-word", severity: "error", message: `Word must be 8 hex digits (32 bits): ${token}`, line: number })
      return
    }

    const word = Number.parseInt(token, 16)
    const label = reverseByte(word & 0xff)
    const sdi = (word >>> 8) & 0x3
    const data = (word >>> 10) & 0x7ffff
    const ssm = (word >>> 29) & 0x3
    const parity = (word >>> 31) & 1
    const ones = popcount(word & 0x7fffffff) + parity
    const parityOk = ones % 2 === 1

    if (!parityOk) {
      issues.push({ code: "parity", severity: "warning", message: `Odd parity fails for word ${token}`, line: number })
    }
    if (label === 0) {
      issues.push({ code: "zero-label", severity: "warning", message: `Label 000 is reserved/null in word ${token}`, line: number })
    }
    const previous = labels.get(label)
    if (previous !== undefined && Math.abs(previous - number) > 1) {
      issues.push({ code: "label-order", severity: "warning", message: `Label ${label} reappears after other labels`, line: number })
    }
    labels.set(label, number)

    const ssmText = ["BCD", "BNR", "Failure Warning", "No Computed Data"][ssm] ?? `SSM ${ssm}`
    records.push({
      id: `word:${number}`,
      kind: "word",
      fields: {
        word: token.toUpperCase(),
        label,
        labelOctal: label.toString(8).padStart(3, "0"),
        sdi,
        data: ssm === 0 ? Number.parseInt(String(data), 10) : data,
        ssm: ssmText,
        parity,
        parityOk,
        line: number,
      },
    })
  })

  const words = records.length
  return {
    format: "ARINC 429",
    records,
    meta: {
      words,
      labels: labels.size,
      parityFailures: records.filter((record) => record.fields.parityOk === false).length,
    },
    issues,
  }
}

const reference = [
  "ARINC 429 32-bit word",
  "",
  "Bit layout, transmitted least significant bit first:",
  "  bits 1-8    label (reversed byte order)",
  "  bits 9-10   SDI",
  "  bits 11-29  data (19 bits)",
  "  bits 30-31  SSM: 00 BCD, 01 BNR, 10 failure warning, 11 no computed data",
  "  bit 32      odd parity over the whole word",
  "",
  "One word per line as 8 hex digits, for example 0x8B1A0000.",
  "The label is sent LSB first, so read it by reversing the low byte.",
].join("\n")

export const format: FormatModule = {
  slug: "arinc429",
  displayName: "ARINC 429",
  extensions: [".429", ".arinc429", ".txt"],
  description: "Decode ARINC 429 words: label, SDI, data, SSM and odd parity.",
  reference,
  parse,
  sample: () =>
    [
      "# label 010 (octal) airborne",
      "0x8B1A0000",
      "0x9C2B0001",
      "0xAD3C0001",
    ].join("\n") + "\n",
}

import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const MESSAGE_TYPES: Record<string, string> = {
  "0": "Heartbeat",
  "1": "TestRequest",
  "2": "ResendRequest",
  "3": "Reject",
  "4": "SequenceReset",
  "5": "Logout",
  "6": "IOI",
  "7": "Advertisement",
  "8": "ExecutionReport",
  "9": "OrderCancelReject",
  A: "Logon",
  D: "NewOrderSingle",
  F: "OrderCancelRequest",
  G: "OrderCancelReplaceRequest",
  H: "OrderStatusRequest",
  J: "AllocationInstruction",
  V: "MarketDataRequest",
  W: "MarketDataSnapshot",
  X: "MarketDataIncrementalRefresh",
  Y: "MarketDataRequestReject",
  AE: "TradeCaptureReport",
}

type Field = {
  tag: string
  value: string
  index: number
  start: number
  end: number
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const raw = text.replace(/[\r\n]+$/, "")

  if (raw.trim().length === 0) {
    issues.push({ code: "empty", severity: "error", message: "Document is empty" })
    return { format: "FIX", records, meta: { fields: 0 }, issues }
  }

  const delimiter = raw.includes("\x01") ? "\x01" : "|"
  const parts = raw.split(delimiter)
  while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop()

  const fields: Field[] = []
  let offset = 0
  parts.forEach((part, index) => {
    const start = offset
    offset += part.length + delimiter.length
    const equals = part.indexOf("=")
    if (equals <= 0) {
      issues.push({
        code: "bad-field",
        severity: "error",
        message: `Field ${index + 1} is not tag=value`,
        line: index + 1,
      })
      return
    }
    const tag = part.slice(0, equals)
    const value = part.slice(equals + 1)
    if (!/^\d+$/.test(tag)) {
      issues.push({
        code: "bad-tag",
        severity: "error",
        message: `Field tag must be numeric: ${tag}`,
        line: index + 1,
      })
    }
    fields.push({ tag, value, index: index + 1, start, end: start + part.length })
    records.push({
      id: `field:${tag}:${index + 1}`,
      kind: "field",
      fields: { tag, value, index: index + 1 },
    })
  })

  const find = (tag: string): Field | undefined => fields.find((field) => field.tag === tag)
  const first = fields[0]
  if (!first || first.tag !== "8") {
    issues.push({ code: "missing-begin-string", severity: "error", message: "First field must be 8=BeginString" })
  } else if (!/^FIX\.\d+\.\d+$/.test(first.value)) {
    issues.push({ code: "bad-begin-string", severity: "error", message: `BeginString must look like FIX.4.4: ${first.value}` })
  }

  if (fields[1]?.tag !== "9") {
    issues.push({ code: "missing-body-length", severity: "error", message: "Second field must be 9=BodyLength" })
  }

  const body = find("9")
  if (body && !/^\d+$/.test(body.value)) {
    issues.push({ code: "bad-body-length", severity: "error", message: `BodyLength must be numeric: ${body.value}` })
  }

  const checksum = find("10")
  if (!checksum) {
    issues.push({ code: "missing-checksum", severity: "error", message: "Message has no 10=CheckSum field" })
  } else if (!/^\d{3}$/.test(checksum.value)) {
    issues.push({ code: "bad-checksum", severity: "error", message: `CheckSum must be three digits: ${checksum.value}` })
  }

  if (fields.length > 0 && fields[fields.length - 1]?.tag !== "10") {
    issues.push({ code: "checksum-not-last", severity: "error", message: "Last field must be 10=CheckSum" })
  }

  const messageType = find("35")
  if (!messageType) {
    issues.push({ code: "missing-msg-type", severity: "error", message: "Message has no 35=MsgType field" })
  } else if (!MESSAGE_TYPES[messageType.value]) {
    issues.push({
      code: "unknown-msg-type",
      severity: "warning",
      message: `Unknown MsgType ${messageType.value}`,
      line: messageType.index,
    })
  }

  if (body && checksum && body.end < checksum.start) {
    const actual = Buffer.byteLength(raw.slice(body.end + delimiter.length, checksum.start), "utf8")
    if (Number(body.value) !== actual) {
      issues.push({
        code: "body-length-mismatch",
        severity: "error",
        message: `BodyLength is ${body.value}, actual is ${actual}`,
        line: body.index,
      })
    }
  }

  if (checksum) {
    const sum = [...Buffer.from(raw.slice(0, checksum.start), "utf8")].reduce((total, byte) => total + byte, 0) % 256
    const expected = String(sum).padStart(3, "0")
    if (checksum.value !== expected) {
      issues.push({
        code: "checksum-mismatch",
        severity: "error",
        message: `CheckSum is ${checksum.value}, expected ${expected}`,
        line: checksum.index,
      })
    }
  }

  const counts = new Map<string, number>()
  for (const field of fields) counts.set(field.tag, (counts.get(field.tag) ?? 0) + 1)
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1)
  for (const [tag, count] of duplicates) {
    issues.push({
      code: "duplicate-tag",
      severity: "warning",
      message: `Tag ${tag} appears ${count} times`,
    })
  }

  return {
    format: "FIX",
    records,
    meta: {
      beginString: first?.value ?? "",
      msgType: messageType?.value ?? "",
      messageName: messageType ? MESSAGE_TYPES[messageType.value] ?? "Unknown" : "",
      fields: fields.length,
      bodyLength: body ? Number(body.value) : 0,
      checksum: checksum?.value ?? "",
      duplicates: duplicates.length,
    },
    issues,
  }
}

function sample(): string {
  const bodyFields = [
    ["35", "D"],
    ["49", "SENDER"],
    ["56", "TARGET"],
    ["34", "1"],
    ["52", "20261113-12:00:00.000"],
    ["11", "ORDER1"],
    ["21", "1"],
    ["55", "AAPL"],
    ["54", "1"],
    ["38", "100"],
    ["40", "1"],
  ] as const
  const body = bodyFields.map(([tag, value]) => `${tag}=${value}`).join("|") + "|"
  const bodyLength = Buffer.byteLength(body, "utf8")
  const head = `8=FIX.4.4|9=${bodyLength}|`
  const checksum = [...Buffer.from(head + body, "utf8")].reduce((total, byte) => total + byte, 0) % 256
  return `${head}${body}10=${String(checksum).padStart(3, "0")}|`
}

const reference = [
  "FIX tag-value message",
  "",
  "8=FIX.4.4|9=...|35=D|49=SENDER|56=TARGET|34=1|52=20261113-12:00:00.000|11=ORDER1|55=AAPL|54=1|38=100|40=1|10=123|",
  "",
  "Fields are tag=value pairs separated by SOH (0x01) or |.",
  "8=BeginString is first; 9=BodyLength is second; 10=CheckSum is last.",
  "BodyLength counts the bytes between the 9= field and the 10= field.",
  "CheckSum is the sum of all bytes before 10= modulo 256, as three digits.",
  "35=MsgType identifies the message; common types include D, 8, F, G and AE.",
].join("\n")

export const format: FormatModule = {
  slug: "fix",
  displayName: "FIX",
  extensions: [".fix", ".fixmsg"],
  description: "Parse FIX tag-value messages, validate BodyLength, CheckSum and required tags.",
  reference,
  parse,
  regressions: [
    {
      doc: "8=FIX.4.4|9=5|35=D|10=000|",
      expectError: "CheckSum",
    },
  ],
  sample,
}

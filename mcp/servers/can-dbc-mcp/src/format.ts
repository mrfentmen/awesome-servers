import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const MESSAGE = /^BO_\s+(\d+)\s+(\w+)\s*:\s*(\d+)\s*(\S*)\s*$/
const SIGNAL = /^SG_\s+(\w+)\s*(?:\w+\s*)?:\s*(\d+)\|(\d+)@([01])([+-])\s*\(([^,]+),([^)]+)\)\s*\[([^|]*)\|([^\]]*)\]\s*"([^"]*)"\s*(.*)$/

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  const seenIds = new Map<number, string>()
  const nodes = new Set<string>()
  let messageCount = 0
  let signalCount = 0
  let current: { id: number; name: string; dlc: number } | null = null

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0) return

    const version = /^VERSION\s+"([^"]*)"/.exec(line)
    if (version) {
      meta.version = version[1]
      return
    }

    const message = MESSAGE.exec(line)
    if (message) {
      const id = Number(message[1])
      const name = message[2]
      const dlc = Number(message[3])
      const sender = message[4]
      if (seenIds.has(id)) {
        issues.push({
          code: "duplicate-message-id",
          severity: "error",
          message: `Message id ${id} already used by ${seenIds.get(id)}`,
          line: number,
        })
      }
      seenIds.set(id, name)
      if (dlc < 0 || dlc > 64) {
        issues.push({ code: "bad-dlc", severity: "error", message: `DLC must be 0-64, got ${dlc}`, line: number })
      }
      if (sender) nodes.add(sender)
      current = { id, name, dlc }
      messageCount += 1
      records.push({
        id: `msg:${id}`,
        kind: "message",
        fields: { id, name, dlc, sender, signals: 0 },
      })
      return
    }

    const signal = SIGNAL.exec(line)
    if (signal) {
      if (!current) {
        issues.push({ code: "orphan-signal", severity: "error", message: "Signal appears before any BO_ message", line: number })
        return
      }
      const [, name, startText, lengthText, byteOrder, sign, factorText, offsetText, minText, maxText, unit, receivers] = signal
      const start = Number(startText)
      const length = Number(lengthText)
      const factor = Number(factorText)
      const offset = Number(offsetText)
      const min = Number(minText)
      const max = Number(maxText)
      const bits = current.dlc * 8

      if (start + length > bits) {
        issues.push({
          code: "signal-out-of-range",
          severity: "error",
          message: `Signal ${name} uses bits ${start}..${start + length - 1} but the message is only ${bits} bits`,
          line: number,
        })
      }
      if (!Number.isFinite(factor) || factor === 0) {
        issues.push({ code: "bad-factor", severity: "error", message: `Signal ${name} factor must be a non zero number`, line: number })
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
        issues.push({ code: "bad-range", severity: "error", message: `Signal ${name} range [${minText}|${maxText}] is invalid`, line: number })
      }
      for (const receiver of receivers.split(",")) {
        const clean = receiver.trim()
        if (clean && clean !== "Vector__XXX") nodes.add(clean)
      }

      signalCount += 1
      const parent = records.find((record) => record.id === `msg:${current?.id}`)
      if (parent && typeof parent.fields.signals === "number") parent.fields.signals += 1

      records.push({
        id: `sig:${current.id}:${name}`,
        kind: "signal",
        fields: {
          message: current.name,
          messageId: current.id,
          name,
          startBit: Number.isFinite(start) ? start : 0,
          length: Number.isFinite(length) ? length : 0,
          byteOrder: byteOrder === "1" ? "intel" : "motorola",
          signed: sign === "-",
          factor: Number.isFinite(factor) ? factor : 0,
          offset: Number.isFinite(offset) ? offset : 0,
          min: Number.isFinite(min) ? min : 0,
          max: Number.isFinite(max) ? max : 0,
          unit,
        },
      })
      return
    }

    if (/^(CM_|VAL_|BA_|BA_DEF_|BA_DEF_DEF_|BO_TX_BU_|SIG_VALTYPE_|NS_|BS_|BU_)/.test(line)) {
      records.push({ id: `attr-${number}`, kind: "attribute", fields: { raw: line } })
      return
    }
  })

  if (messageCount === 0) {
    issues.push({ code: "no-messages", severity: "error", message: "No BO_ message definitions found" })
  }

  meta.messages = messageCount
  meta.signals = signalCount
  meta.nodes = nodes.size
  meta.totalBits = records
    .filter((record) => record.kind === "message")
    .reduce((sum, record) => sum + Number(record.fields.dlc) * 8, 0)

  return { format: "CAN DBC", records, meta, issues }
}

const reference = [
  "CAN DBC database",
  "",
  'BO_ 100 MessageName: 8 SenderNode',
  ' SG_ SignalName : 0|16@1+ (0.25,0) [0|16383.75] "rpm" Receiver',
  "",
  "BO_ id is decimal, then name, colon, DLC in bytes and the sender node.",
  "SG_ startBit|length@byteOrder sign (factor,offset) [min|max] \"unit\" receivers",
  "byteOrder 1 is Intel little endian, 0 is Motorola big endian.",
  "sign + is unsigned, - is signed.",
  "A signal must fit inside DLC * 8 bits.",
].join("\n")

export const format: FormatModule = {
  slug: "can-dbc",
  displayName: "CAN DBC",
  extensions: [".dbc"],
  description: "Parse DBC messages and signals, validate bit layouts and ranges.",
  reference,
  parse,
  sample: () =>
    [
      'VERSION "1.0"',
      "NS_ :",
      "BS_:",
      "BU_: ECM TCM",
      "BO_ 100 EngineData: 8 ECM",
      ' SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|16383.75] "rpm" TCM',
      ' SG_ CoolantTemp : 16|8@1+ (1,-40) [-40|215] "degC" TCM',
    ].join("\n") + "\n",
}

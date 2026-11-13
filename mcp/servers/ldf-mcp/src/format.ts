import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const protocol = /LIN_protocol_version\s*=\s*"([^"]+)"/.exec(text)?.[1] ?? ""
  const language = /LIN_language_version\s*=\s*"([^"]+)"/.exec(text)?.[1] ?? ""
  const speed = /LIN_speed\s*=\s*([\d.]+)\s*kbps/.exec(text)?.[1] ?? ""
  const nodesBlock = /Nodes\s*\{([\s\S]*?)\}/.exec(text)?.[1] ?? ""
  const signalsBlock = /Signals\s*\{([\s\S]*?)\}/.exec(text)?.[1] ?? ""
  const framesBlock = /Frames\s*\{([\s\S]*)$/.exec(text)?.[1] ?? ""
  const master = /Master\s*:\s*([^,;\s]+)/.exec(nodesBlock)?.[1] ?? ""
  const slaves = (/Slaves\s*:\s*([^;]+)/.exec(nodesBlock)?.[1] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
  const signals = new Set<string>()

  for (const match of signalsBlock.matchAll(/([A-Za-z_]\w*)\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*([^,]+)\s*,\s*([^;]+);/g)) {
    signals.add(match[1])
    records.push({ id: `signal:${match[1]}`, kind: "signal", fields: { size: Number(match[2]), publisher: match[4].trim(), subscriber: match[5].trim() } })
  }

  const frameHeaders = [...framesBlock.matchAll(/^\s*([A-Za-z_]\w*)\s*:\s*(0x[0-9A-Fa-f]+|\d+)\s*,\s*([^,\n]+)\s*,\s*(\d+)\s*\{/gm)]
  for (const match of frameHeaders) {
    records.push({ id: `frame:${match[1]}`, kind: "frame", fields: { id: match[2], publisher: match[3].trim(), length: Number(match[4]) } })
  }

  const refs = [...framesBlock.matchAll(/([A-Za-z_]\w*)\s*,\s*\d+\s*;/g)].map((match) => match[1])
  for (const ref of refs) {
    if (!signals.has(ref)) issues.push({ code: "unknown-signal", severity: "error", message: `Frame references unknown signal ${ref}` })
  }

  if (!/LIN_description_file\s*;/.test(text)) issues.push({ code: "no-header", severity: "error", message: "Missing LIN_description_file header" })
  if (!protocol) issues.push({ code: "no-protocol", severity: "error", message: "Missing LIN_protocol_version" })
  if (!language) issues.push({ code: "no-language", severity: "error", message: "Missing LIN_language_version" })
  if (!speed) issues.push({ code: "no-speed", severity: "error", message: "Missing LIN_speed" })
  if (!master) issues.push({ code: "no-master", severity: "error", message: "Nodes has no Master" })
  if (slaves.length === 0) issues.push({ code: "no-slaves", severity: "error", message: "Nodes has no Slaves" })
  if (signals.size === 0) issues.push({ code: "no-signals", severity: "error", message: "Signals block is empty" })
  if (frameHeaders.length === 0) issues.push({ code: "no-frames", severity: "error", message: "Frames block is empty" })

  return {
    format: "LDF",
    records,
    meta: { protocol, language, speed: speed ? Number(speed) : 0, master, slaves: slaves.length, signals: signals.size, frames: frameHeaders.length },
    issues,
  }
}

const reference = [
  "LIN description file",
  "",
  "LIN_description_file;",
  'LIN_protocol_version = "2.1";',
  'LIN_language_version = "2.1";',
  "LIN_speed = 19.2 kbps;",
  "Nodes {",
  "  Master: Master, 5 ms, 0.1 ms;",
  "  Slaves: S1;",
  "}",
  "Signals {",
  "  Sig1: 8, 0, Master, S1;",
  "}",
  "Frames {",
  "  Frame1: 0x10, Master, 8 {",
  "    Sig1, 0;",
  "  }",
  "}",
  "",
  "Required header and version lines.",
  "Nodes needs one Master and at least one Slave.",
  "Every signal used in a Frame must be declared in Signals.",
].join("\n")

export const format: FormatModule = {
  slug: "ldf",
  displayName: "LDF",
  extensions: [".ldf"],
  description: "Parse LIN description files, validate nodes, signals and frame references.",
  reference,
  parse,
  sample: () =>
    [
      "LIN_description_file;",
      'LIN_protocol_version = "2.1";',
      'LIN_language_version = "2.1";',
      "LIN_speed = 19.2 kbps;",
      "Nodes {",
      "  Master: Master, 5 ms, 0.1 ms;",
      "  Slaves: S1;",
      "}",
      "Signals {",
      "  Sig1: 8, 0, Master, S1;",
      "  Sig2: 8, 0, S1, Master;",
      "}",
      "Frames {",
      "  Frame1: 0x10, Master, 8 {",
      "    Sig1, 0;",
      "    Sig2, 8;",
      "  }",
      "}",
    ].join("\n") + "\n",
}

import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ACTIONS = new Set(["alert", "log", "pass", "drop", "reject", "sdrop"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const sids = new Set<string>()
  let rules = 0

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim()
    const lineNo = index + 1
    if (!line || line.startsWith("#")) continue
    const match = /^(alert|log|pass|drop|reject|sdrop)\s+(\w+)\s+(\S+)\s+(\S+)\s+(->|<>)\s+(\S+)\s+(\S+)\s*\((.*)\)\s*$/.exec(line)
    if (!match) {
      issues.push({ code: "bad-rule", severity: "error", message: "Rule header must be action proto src direction dst port (options)", line: lineNo })
      continue
    }
    const action = match[1]
    if (!ACTIONS.has(action)) issues.push({ code: "bad-action", severity: "error", message: `Unknown action: ${action}`, line: lineNo })
    const options = match[8]
    const sid = /(?:^|;)\s*sid\s*:\s*(\d+)/.exec(options)?.[1] ?? ""
    const rev = /(?:^|;)\s*rev\s*:\s*(\d+)/.exec(options)?.[1] ?? ""
    const msg = /(?:^|;)\s*msg\s*:\s*"([^"]*)"/.exec(options)?.[1] ?? ""
    if (!sid) issues.push({ code: "no-sid", severity: "error", message: "Rule has no sid", line: lineNo })
    else if (sids.has(sid)) issues.push({ code: "duplicate-sid", severity: "error", message: `Duplicate sid ${sid}`, line: lineNo })
    else sids.add(sid)
    if (!rev) issues.push({ code: "no-rev", severity: "error", message: "Rule has no rev", line: lineNo })
    if (!msg) issues.push({ code: "no-msg", severity: "warning", message: "Rule has no msg", line: lineNo })
    rules += 1
    records.push({
      id: `sid:${sid || rules}`,
      kind: "rule",
      fields: { action, protocol: match[2], src: match[3], sport: match[4], direction: match[5], dst: match[6], port: match[7], rev: rev ? Number(rev) : null, message: msg, line: lineNo },
    })
  }

  if (rules === 0) issues.push({ code: "no-rules", severity: "error", message: "File has no Snort rules" })

  return { format: "Snort", records, meta: { rules, sids: sids.size }, issues }
}

const reference = [
  "Snort rules",
  "",
  'alert tcp $HOME_NET any -> $EXTERNAL_NET 80 (msg:"HTTP test"; sid:1000001; rev:1;)',
  'drop tcp any any -> any 22 (msg:"Block SSH"; sid:1000002; rev:2;)',
  "",
  "Header: action protocol source direction destination port (options).",
  "Options include msg, sid and rev, separated by semicolons.",
  "sid values must be unique.",
].join("\n")

export const format: FormatModule = {
  slug: "snort",
  displayName: "Snort",
  extensions: [".rules"],
  description: "Parse Snort rules, validate headers, actions, sids and revisions.",
  reference,
  parse,
  sample: () =>
    [
      'alert tcp $HOME_NET any -> $EXTERNAL_NET 80 (msg:"HTTP test"; sid:1000001; rev:1;)',
      'drop tcp any any -> any 22 (msg:"Block SSH"; sid:1000002; rev:2;)',
    ].join("\n") + "\n",
}

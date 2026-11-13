import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, validateXml } from "./_xml.js"

const CONDITIONS = ["if_sid", "if_matched_sid", "if_group", "if_level", "match", "regex", "decoded_as", "srcip", "dstip", "user", "program_name", "hostname", "time", "weekday", "id", "url", "location", "field"]
const textOf = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block)
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : ""
}
const attrs = (source: string): Record<string, string> =>
  Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]))

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const root = readRoot(source)
  validateXml(source, root, "OSSEC rules", issues)
  if (root && root !== "group") issues.push({ code: "bad-root", severity: "error", message: `Root must be group, found ${root}` })

  const groupAttrs = /<group\b([^>]*)>/i.exec(source)?.[1] ?? ""
  const groupName = attrs(groupAttrs).name ?? ""
  if (!groupName) issues.push({ code: "no-group-name", severity: "error", message: "Top-level group has no name" })

  const rules = [...source.matchAll(/<rule\b([^>]*)>([\s\S]*?)<\/rule>/gi)]
  const ids = new Set<string>()
  let maxLevel = 0
  for (const rule of rules) {
    const meta = attrs(rule[1])
    const id = meta.id ?? ""
    const level = Number(meta.level)
    const description = textOf(rule[2], "description")
    const conditionCount = CONDITIONS.filter((tag) => new RegExp(`<${tag}\\b`, "i").test(rule[2])).length
    if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 999999) issues.push({ code: "bad-id", severity: "error", message: `Rule id must be 1-999999: ${id || "missing"}` })
    if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `Duplicate rule id ${id}` })
    ids.add(id)
    if (!Number.isInteger(level) || level < 0 || level > 15) issues.push({ code: "bad-level", severity: "error", message: `Rule ${id || "?"} level must be 0-15: ${meta.level ?? "missing"}` })
    else maxLevel = Math.max(maxLevel, level)
    if (!description) issues.push({ code: "no-description", severity: "error", message: `Rule ${id || "?"} has no description` })
    if (conditionCount === 0) issues.push({ code: "no-condition", severity: "warning", message: `Rule ${id || "?"} has no match condition` })
    records.push({ id: `rule:${id || records.length + 1}`, kind: "rule", fields: { ruleId: id, level: Number.isInteger(level) ? level : -1, description, conditions: conditionCount, group: groupName } })
  }

  if (rules.length === 0) issues.push({ code: "no-rules", severity: "error", message: "No rule elements found" })

  return { format: "OSSEC", records, meta: { group: groupName, rules: rules.length, maxLevel }, issues }
}

const reference = [
  "OSSEC rules",
  "",
  '<group name="demo,">',
  '  <rule id="100001" level="7">',
  "    <if_sid>5710</if_sid>",
  "    <description>Demo rule</description>",
  "    <group>demo,</group>",
  "  </rule>",
  "</group>",
  "",
  "The root is a group with a name.",
  "Rule ids are 1-999999 and levels are 0-15.",
  "Each rule needs a description and at least one condition tag.",
].join("\n")

export const format: FormatModule = {
  slug: "ossec",
  displayName: "OSSEC",
  extensions: [".xml", "ossec.conf"],
  description: "Parse OSSEC rules, validate ids, levels, groups and descriptions.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<group name="demo,">',
      '  <rule id="100001" level="7">',
      "    <if_sid>5710</if_sid>",
      "    <description>Demo rule</description>",
      "    <group>demo,</group>",
      "  </rule>",
      '  <rule id="100002" level="10">',
      "    <match>failure</match>",
      "    <description>Demo failure</description>",
      "  </rule>",
      "</group>",
    ].join("\n") + "\n",
}

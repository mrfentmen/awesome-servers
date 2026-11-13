import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const FAMILIES = new Set(["ip", "ip6", "inet", "arp", "bridge", "netdev"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const stack: Array<{ kind: string; name: string; line: number; hasHook: boolean; hasPolicy: boolean }> = []
  const tables = new Set<string>()

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return

    if (line === "}") {
      const closed = stack.pop()
      if (!closed) {
        issues.push({ code: "unmatched-close", severity: "error", message: "Closing brace without an open table or chain", line: number })
        return
      }
      if (closed.kind === "chain" && !closed.hasHook) {
        issues.push({
          code: "chain-without-hook",
          severity: "warning",
          message: `Chain ${closed.name} has no type/hook line`,
          line: closed.line,
        })
      }
      return
    }

    const table = /^table\s+([A-Za-z0-9_]+)\s+([A-Za-z0-9_-]+)\s*\{$/.exec(line)
    if (table) {
      const family = table[1]
      const name = table[2]
      if (!FAMILIES.has(family)) {
        issues.push({ code: "bad-family", severity: "error", message: `Unknown table family: ${family}`, line: number })
      }
      const key = `${family}/${name}`
      if (tables.has(key)) {
        issues.push({ code: "duplicate-table", severity: "error", message: `Table ${key} is declared twice`, line: number })
      }
      tables.add(key)
      stack.push({ kind: "table", name: key, line: number, hasHook: true, hasPolicy: true })
      records.push({ id: `table:${key}`, kind: "table", fields: { family, name, line: number } })
      return
    }

    const chain = /^chain\s+([A-Za-z0-9_-]+)\s*\{$/.exec(line)
    if (chain) {
      if (!stack.some((entry) => entry.kind === "table")) {
        issues.push({ code: "chain-outside-table", severity: "error", message: `Chain ${chain[1]} is not inside a table`, line: number })
      }
      stack.push({ kind: "chain", name: chain[1], line: number, hasHook: false, hasPolicy: false })
      records.push({ id: `chain:${chain[1]}`, kind: "chain", fields: { name: chain[1], line: number } })
      return
    }

    const current = stack[stack.length - 1]
    const typeLine = /^type\s+(\w+)\s+hook\s+(\w+)/.exec(line)
    if (typeLine) {
      if (!current || current.kind !== "chain") {
        issues.push({ code: "type-outside-chain", severity: "error", message: "type/hook line must be inside a chain", line: number })
      } else {
        current.hasHook = true
      }
      records.push({ id: `hook:${number}`, kind: "hook", fields: { type: typeLine[1], hook: typeLine[2] } })
      return
    }

    const policy = /^policy\s+(\w+)\s*;?$/.exec(line)
    if (policy) {
      if (!current || current.kind !== "chain") {
        issues.push({ code: "policy-outside-chain", severity: "error", message: "policy must be inside a chain", line: number })
      } else {
        current.hasPolicy = true
      }
      if (!["accept", "drop"].includes(policy[1])) {
        issues.push({ code: "bad-policy", severity: "error", message: `Policy must be accept or drop, got ${policy[1]}`, line: number })
      }
      records.push({ id: `policy:${number}`, kind: "policy", fields: { value: policy[1] } })
      return
    }

    if (/^(flush|add|delete|insert|replace)\s+rule\b/.test(line)) {
      records.push({ id: `rule:${number}`, kind: "rule", fields: { raw: line.slice(0, 200), line: number } })
      return
    }
    if (current?.kind === "chain") {
      records.push({ id: `rule:${number}`, kind: "rule", fields: { raw: line.slice(0, 200), line: number } })
      return
    }

    if (/^include\s+/.test(line)) {
      records.push({ id: `include:${number}`, kind: "include", fields: { path: line.replace(/^include\s+/, "") } })
      return
    }

    issues.push({ code: "unknown-line", severity: "error", message: `Not valid nftables syntax: ${line.slice(0, 60)}`, line: number })
  })

  for (const open of stack) {
    issues.push({ code: "unclosed-block", severity: "error", message: `${open.kind} ${open.name} opened at line ${open.line} is never closed`, line: open.line })
  }
  if (tables.size === 0) {
    issues.push({ code: "no-table", severity: "error", message: "Ruleset defines no table" })
  }

  return {
    format: "nftables",
    records,
    meta: {
      tables: tables.size,
      chains: records.filter((record) => record.kind === "chain").length,
      rules: records.filter((record) => record.kind === "rule").length,
      policies: records.filter((record) => record.kind === "policy").length,
    },
    issues,
  }
}

const reference = [
  "nftables ruleset",
  "",
  "table inet filter {",
  "  chain input {",
  "    type filter hook input priority 0; policy drop;",
  "    tcp dport 22 accept",
  "  }",
  "}",
  "",
  "Families: ip, ip6, inet, arp, bridge, netdev.",
  "A base chain declares type and hook; a regular chain does not.",
  "policy is accept or drop.",
  "Comments start with #.",
].join("\n")

export const format: FormatModule = {
  slug: "nftables",
  displayName: "nftables",
  extensions: [".nft"],
  description: "Parse nftables rulesets, validate tables, chains, hooks and policies.",
  reference,
  parse,
  sample: () =>
    [
      "table inet filter {",
      "  chain input {",
      "    type filter hook input priority 0; policy drop;",
      "    tcp dport 22 accept",
      "    ct state established,related accept",
      "  }",
      "}",
    ].join("\n") + "\n",
}

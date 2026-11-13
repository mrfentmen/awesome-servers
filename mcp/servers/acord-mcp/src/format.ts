import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "ACORD message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let requests = 0
  let policies = 0
  let policyNumbers = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name.endsWith("Rq")) {
      requests += 1
      records.push({ id: `request:${requests}`, kind: "request", fields: { type: name, id: tag.attrs.id ?? "", line: tag.line } })
      continue
    }
    if (name === "Policy") {
      policies += 1
      records.push({ id: `policy:${policies}`, kind: "policy", fields: { line: tag.line } })
      continue
    }
    if (name === "PolicyNumber") {
      policyNumbers += 1
    }
  }

  if (local(root) !== "ACORD") {
    issues.push({ code: "bad-root", severity: "error", message: `Root element must be ACORD, found ${root || "nothing"}` })
  }
  if (requests === 0) issues.push({ code: "no-request", severity: "error", message: "Message has no request element ending in Rq" })
  if (policies > 0 && policyNumbers === 0) {
    issues.push({ code: "policy-without-number", severity: "warning", message: "Policy elements carry no PolicyNumber" })
  }

  return {
    format: "ACORD",
    records,
    meta: { root: local(root), requests, policies, policyNumbers },
    issues,
  }
}

const reference = [
  "ACORD insurance message (XML)",
  "",
  "<ACORD>",
  "  <InsuranceSvcRq>",
  "    <HomePolicyQuoteInqRq>",
  "      <Policy><PolicyNumber>POL-1</PolicyNumber></Policy>",
  "    </HomePolicyQuoteInqRq>",
  "  </InsuranceSvcRq>",
  "</ACORD>",
  "",
  "Root is ACORD.",
  "Requests end in Rq (quote, inquiry, claim).",
  "Policies should carry a PolicyNumber.",
].join("\n")

export const format: FormatModule = {
  slug: "acord",
  displayName: "ACORD",
  extensions: [".xml"],
  description: "Parse ACORD insurance messages, validate requests, policies and numbers.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<ACORD>",
      "  <InsuranceSvcRq>",
      "    <HomePolicyQuoteInqRq>",
      "      <Policy><PolicyNumber>POL-1</PolicyNumber></Policy>",
      "    </HomePolicyQuoteInqRq>",
      "  </InsuranceSvcRq>",
      "</ACORD>",
    ].join("\n") + "\n",
}

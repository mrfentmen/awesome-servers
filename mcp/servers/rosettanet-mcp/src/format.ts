import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "RosettaNet message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let headers = 0
  let fromRoles = 0
  let toRoles = 0
  let lineItems = 0
  let references = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "PipHeader") {
      headers += 1
      records.push({ id: "header", kind: "header", fields: { line: tag.line } })
      continue
    }
    if (name === "fromRole") {
      fromRoles += 1
      records.push({ id: `from:${fromRoles}`, kind: "fromRole", fields: { partner: tag.attrs.PartnerRoleClassCode ?? "", line: tag.line } })
      continue
    }
    if (name === "toRole") {
      toRoles += 1
      records.push({ id: `to:${toRoles}`, kind: "toRole", fields: { partner: tag.attrs.PartnerRoleClassCode ?? "", line: tag.line } })
      continue
    }
    if (name === "GlobalDocumentReference") {
      references += 1
      continue
    }
    if (/LineItem$/.test(name) || name === "ProductLineItem") {
      lineItems += 1
      records.push({ id: `line:${lineItems}`, kind: "lineItem", fields: { line: tag.line } })
    }
  }

  const rootName = local(root)
  if (!/^Pip\d/i.test(rootName)) {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be a PIP message such as Pip3A4PurchaseOrderRequest, found ${rootName || "nothing"}` })
  }
  if (headers === 0) issues.push({ code: "no-header", severity: "error", message: "Message has no PipHeader" })
  if (fromRoles === 0 || toRoles === 0) {
    issues.push({ code: "no-roles", severity: "error", message: "Message needs both fromRole and toRole" })
  }
  if (lineItems === 0) issues.push({ code: "no-lines", severity: "warning", message: "Message has no line item" })

  return {
    format: "RosettaNet",
    records,
    meta: { root: rootName, headers, fromRoles, toRoles, lineItems, references },
    issues,
  }
}

const reference = [
  "RosettaNet PIP message (XML)",
  "",
  "<Pip3A4PurchaseOrderRequest>",
  "  <PipHeader>",
  "    <fromRole PartnerRoleClassCode=\"Buyer\"/>",
  "    <toRole PartnerRoleClassCode=\"Seller\"/>",
  "    <GlobalDocumentReference/>",
  "  </PipHeader>",
  "  <RequestPurchaseOrder>",
  "    <ProductLineItem/>",
  "  </RequestPurchaseOrder>",
  "</Pip3A4PurchaseOrderRequest>",
  "",
  "Root is a PIP message such as Pip3A4PurchaseOrderRequest.",
  "PipHeader carries fromRole and toRole.",
  "Business documents hold line items.",
].join("\n")

export const format: FormatModule = {
  slug: "rosettanet",
  displayName: "RosettaNet",
  extensions: [".xml"],
  description: "Parse RosettaNet PIP messages, validate headers, roles and line items.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<Pip3A4PurchaseOrderRequest>",
      "  <PipHeader>",
      '    <fromRole PartnerRoleClassCode="Buyer"/>',
      '    <toRole PartnerRoleClassCode="Seller"/>',
      "    <GlobalDocumentReference/>",
      "  </PipHeader>",
      "  <RequestPurchaseOrder>",
      "    <ProductLineItem/>",
      "  </RequestPurchaseOrder>",
      "</Pip3A4PurchaseOrderRequest>",
    ].join("\n") + "\n",
}

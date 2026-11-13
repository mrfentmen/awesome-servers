import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const PRODUCTS = new Set(["swap", "fra", "capFloor", "swaption", "fxSingleLeg", "fxSwap", "termDeposit", "bulletPayment", "commoditySwap", "creditDefaultSwap", "equityOption"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "FpML message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const tradeIds = new Set<string>()
  let trades = 0
  let parties = 0
  let products = 0
  let version = ""
  const productTypes = new Set<string>()

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "FpML") {
      version = tag.attrs.fpmlVersion ?? ""
      if (!version) issues.push({ code: "no-version", severity: "error", message: "FpML root has no fpmlVersion" })
      else if (!/^\d-\d+$/.test(version)) issues.push({ code: "bad-version", severity: "error", message: `fpmlVersion must look like 5-12, found ${version}` })
      continue
    }
    if (name === "trade") {
      trades += 1
      const id = tag.attrs.id ?? ""
      if (id) {
        if (tradeIds.has(id)) issues.push({ code: "duplicate-trade", severity: "error", message: `Trade ${id} appears twice`, line: tag.line })
        tradeIds.add(id)
      }
      records.push({ id: `trade:${id || trades}`, kind: "trade", fields: { id, line: tag.line } })
      continue
    }
    if (name === "party") {
      parties += 1
      records.push({ id: `party:${tag.attrs.id ?? parties}`, kind: "party", fields: { id: tag.attrs.id ?? "", line: tag.line } })
      continue
    }
    if (PRODUCTS.has(name)) {
      products += 1
      productTypes.add(name)
      records.push({ id: `product:${products}`, kind: name, fields: { line: tag.line } })
    }
  }

  if (local(root) !== "FpML") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be FpML, found ${root || "nothing"}` })
  }
  if (trades === 0) issues.push({ code: "no-trades", severity: "error", message: "Message has no trade" })
  if (products === 0) issues.push({ code: "no-product", severity: "warning", message: "No product element found in any trade" })

  return {
    format: "FpML",
    records,
    meta: { version, trades, parties, products: products, productTypes: [...productTypes].join(",") },
    issues,
  }
}

const reference = [
  "FpML derivatives message",
  "",
  '<FpML xmlns="http://www.fpml.org/FpML-5/confirmation" fpmlVersion="5-12">',
  "  <trade>",
  "    <tradeHeader><partyReference href=\"p1\"/></tradeHeader>",
  "    <swap>",
  '      <swapStream><payerPartyReference href="p1"/></swapStream>',
  '      <swapStream><receiverPartyReference href="p2"/></swapStream>',
  "    </swap>",
  "  </trade>",
  "</FpML>",
  "",
  "Root is FpML with an fpmlVersion such as 5-12.",
  "Each trade holds one product such as swap or fra.",
  "Parties are referenced by href.",
].join("\n")

export const format: FormatModule = {
  slug: "fpml",
  displayName: "FpML",
  extensions: [".xml", ".fpml"],
  description: "Parse FpML messages, validate versions, trades, parties and products.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<FpML xmlns="http://www.fpml.org/FpML-5/confirmation" fpmlVersion="5-12">',
      '  <trade id="T1">',
      '    <tradeHeader><partyReference href="p1"/></tradeHeader>',
      "    <swap>",
      '      <swapStream><payerPartyReference href="p1"/></swapStream>',
      '      <swapStream><receiverPartyReference href="p2"/></swapStream>',
      "    </swap>",
      "  </trade>",
      '  <party id="p1"/>',
      '  <party id="p2"/>',
      "</FpML>",
    ].join("\n") + "\n",
}

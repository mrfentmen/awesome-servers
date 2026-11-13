import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "Murex export", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const currencies = new Set<string>()
  let total = 0

  for (const tag of tags) {
    if (tag.close || !/^trade$/i.test(tag.name)) continue
    const id = tag.attrs.id ?? tag.attrs.tradeId ?? ""
    if (!id) {
      issues.push({ code: "trade-without-id", severity: "error", message: "Trade has no id", line: tag.line })
    } else if (ids.has(id)) {
      issues.push({ code: "duplicate-trade", severity: "error", message: `Trade ${id} appears twice`, line: tag.line })
    }
    ids.add(id)

    const amountText = tag.attrs.amount ?? tag.attrs.notional ?? ""
    let amount = 0
    if (amountText) {
      amount = Number(amountText.replace(/,/g, ""))
      if (!Number.isFinite(amount)) {
        issues.push({ code: "bad-amount", severity: "error", message: `Trade ${id || tag.line} amount is not numeric: ${amountText}`, line: tag.line })
        amount = 0
      }
    } else {
      issues.push({ code: "missing-amount", severity: "warning", message: `Trade ${id || tag.line} has no amount`, line: tag.line })
    }
    const currency = tag.attrs.currency ?? ""
    if (currency) currencies.add(currency)
    total += amount

    records.push({ id: `trade:${id || tag.line}`, kind: "trade", fields: { id, amount, currency, line: tag.line } })
  }

  if (records.length === 0) {
    issues.push({ code: "no-trades", severity: "error", message: "Export contains no Trade element" })
  }

  return {
    format: "Murex",
    records,
    meta: {
      root,
      trades: records.length,
      currencies: currencies.size,
      totalAmount: Number(total.toFixed(2)),
    },
    issues,
  }
}

const reference = [
  "Murex trade export (XML)",
  "",
  "<MurexExport>",
  "  <Trade id=\"T1\" amount=\"1000000\" currency=\"EUR\"/>",
  "  <Trade id=\"T2\" amount=\"250000\" currency=\"USD\"/>",
  "</MurexExport>",
  "",
  "Each Trade carries a unique id, a numeric amount and a currency.",
  "amount or notional is accepted for the cash amount.",
  "The root element is reported, not enforced.",
].join("\n")

export const format: FormatModule = {
  slug: "murex",
  displayName: "Murex",
  extensions: [".murex"],
  description: "Parse Murex trade export XML, validate trade ids, amounts and currencies.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<MurexExport>",
      '  <Trade id="T1" amount="1000000" currency="EUR"/>',
      '  <Trade id="T2" amount="250000" currency="USD"/>',
      "</MurexExport>",
    ].join("\n") + "\n",
}

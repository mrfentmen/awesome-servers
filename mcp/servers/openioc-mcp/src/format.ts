import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, validateXml } from "./_xml.js"

const CONDITIONS = new Set(["is", "isnot", "contains", "containsnot", "matches", "matchesnot", "starts-with", "ends-with", "greater-than", "less-than"])
const attrs = (source: string): Record<string, string> =>
  Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]))
const textOf = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block)
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : ""
}

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const root = readRoot(source)
  validateXml(source, root, "OpenIOC document", issues)
  if (root && root !== "ioc") issues.push({ code: "bad-root", severity: "error", message: `Root must be ioc, found ${root}` })
  const iocId = /<ioc\b([^>]*)>/i.exec(source)?.[1] ?? ""
  const id = attrs(iocId).id ?? ""
  if (!id) issues.push({ code: "no-ioc-id", severity: "error", message: "ioc has no id attribute" })

  const indicators = [...source.matchAll(/<Indicator\b([^>]*)>([\s\S]*?)<\/Indicator>/gi)]
  const indicatorIds = new Set<string>()
  let items = 0
  indicators.forEach((indicator, index) => {
    const meta = attrs(indicator[1])
    const operator = (meta.operator ?? "OR").toUpperCase()
    const indicatorId = meta.id ?? `indicator:${index + 1}`
    if (!["AND", "OR"].includes(operator)) issues.push({ code: "bad-operator", severity: "error", message: `Indicator operator must be AND or OR: ${operator}` })
    if (indicatorIds.has(indicatorId)) issues.push({ code: "duplicate-indicator", severity: "error", message: `Duplicate Indicator id ${indicatorId}` })
    indicatorIds.add(indicatorId)
    records.push({ id: `indicator:${indicatorId}`, kind: "indicator", fields: { indicatorId, operator, items: 0 } })

    const children = [...indicator[2].matchAll(/<IndicatorItem\b([^>]*)>([\s\S]*?)<\/IndicatorItem>/gi)]
    if (children.length === 0) issues.push({ code: "empty-indicator", severity: "error", message: `Indicator ${indicatorId} has no IndicatorItem` })
    for (const child of children) {
      const childMeta = attrs(child[1])
      const condition = childMeta.condition ?? ""
      const itemId = childMeta.id ?? `item:${items + 1}`
      if (!CONDITIONS.has(condition)) issues.push({ code: "bad-condition", severity: "error", message: `Unknown IndicatorItem condition: ${condition || "missing"}` })
      const context = /<Context\b([^>]*?)\/?>/i.exec(child[2])?.[1] ?? ""
      const contextMeta = attrs(context)
      if (!contextMeta.document) issues.push({ code: "no-context-document", severity: "error", message: `IndicatorItem ${itemId} has no Context document` })
      if (!contextMeta.search) issues.push({ code: "no-context-search", severity: "error", message: `IndicatorItem ${itemId} has no Context search` })
      const content = textOf(child[2], "Content")
      if (!content) issues.push({ code: "no-content", severity: "error", message: `IndicatorItem ${itemId} has no Content` })
      items += 1
      records.push({
        id: `item:${itemId}`,
        kind: "item",
        fields: { itemId, indicatorId, condition, document: contextMeta.document ?? "", search: contextMeta.search ?? "", content },
      })
    }
  })

  if (indicators.length === 0) issues.push({ code: "no-indicators", severity: "error", message: "IOC has no Indicator" })

  return {
    format: "OpenIOC",
    records,
    meta: { id, shortDescription: textOf(source, "short_description"), indicators: indicators.length, items },
    issues,
  }
}

const reference = [
  "OpenIOC document",
  "",
  '<ioc xmlns="http://schemas.mandiant.com/2010/ioc" id="demo-ioc">',
  "  <short_description>Demo IOC</short_description>",
  '  <Indicator operator="OR" id="ind-1">',
  '    <IndicatorItem condition="is" id="item-1">',
  '      <Context document="ProcessItem" search="ProcessItem/name" type="mir"/>',
  '      <Content type="string">demo.exe</Content>',
  "    </IndicatorItem>",
  "  </Indicator>",
  "</ioc>",
  "",
  "The ioc root needs an id.",
  "Indicators use AND or OR and hold at least one IndicatorItem.",
  "Each item needs Context document/search and Content text.",
].join("\n")

export const format: FormatModule = {
  slug: "openioc",
  displayName: "OpenIOC",
  extensions: [".ioc"],
  description: "Parse OpenIOC bundles, validate indicators, conditions and content.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<ioc xmlns="http://schemas.mandiant.com/2010/ioc" id="demo-ioc" last-modified="2026-11-13T00:00:00">',
      "  <short_description>Demo IOC</short_description>",
      '  <Indicator operator="OR" id="ind-1">',
      '    <IndicatorItem condition="is" id="item-1">',
      '      <Context document="ProcessItem" search="ProcessItem/name" type="mir"/>',
      '      <Content type="string">demo.exe</Content>',
      "    </IndicatorItem>",
      "  </Indicator>",
      "</ioc>",
    ].join("\n") + "\n",
}

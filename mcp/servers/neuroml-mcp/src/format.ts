import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

const INTERESTING = new Set(["cell", "population", "network", "populationList", "ionChannel", "synapse", "input"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "neuroml", "NeuroML", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const cellIds = new Set<string>()
  const root = tags.find((tag) => tag.name === "neuroml")

  for (const tag of tags) {
    if (tag.close) continue
    if (tag.name === "cell" && tag.attrs.id) cellIds.add(tag.attrs.id)
    if (tag.name === "population") {
      const size = Number(tag.attrs.size)
      if (!tag.attrs.component) {
        issues.push({ code: "population-without-component", severity: "error", message: `population ${tag.attrs.id ?? "?"} has no component`, line: tag.line })
      }
      if (!Number.isInteger(size) || size <= 0) {
        issues.push({ code: "bad-population-size", severity: "error", message: `population ${tag.attrs.id ?? "?"} size must be a positive integer`, line: tag.line })
      }
    }
    if (!INTERESTING.has(tag.name)) continue
    records.push({
      id: `${tag.name}:${tag.attrs.id ?? records.length + 1}`,
      kind: tag.name,
      fields: {
        id: tag.attrs.id ?? "",
        component: tag.attrs.component ?? "",
        size: tag.attrs.size ? Number(tag.attrs.size) : null,
        type: tag.attrs.type ?? "",
        line: tag.line,
      },
    })
  }

  for (const record of records) {
    if (record.kind !== "population") continue
    const component = String(record.fields.component ?? "")
    if (component && !cellIds.has(component)) {
      issues.push({ code: "unknown-component", severity: "warning", message: `population ${record.fields.id} references cell ${component}, which is not defined` })
    }
  }
  if (!root) {
    issues.push({ code: "no-root", severity: "error", message: "Document has no neuroml root element" })
  }
  if (records.filter((record) => record.kind === "cell").length === 0) {
    issues.push({ code: "no-cells", severity: "warning", message: "Model declares no cell" })
  }

  return {
    format: "NeuroML",
    records,
    meta: {
      id: root?.attrs.id ?? "",
      cells: records.filter((record) => record.kind === "cell").length,
      populations: records.filter((record) => record.kind === "population").length,
      networks: records.filter((record) => record.kind === "network").length,
      totalInstances: records.reduce((sum, record) => sum + (typeof record.fields.size === "number" ? record.fields.size : 0), 0),
    },
    issues,
  }
}

const reference = [
  "NeuroML model",
  "",
  "<neuroml xmlns=\"http://www.neuroml.org/schema/neuroml2\" id=\"example\">",
  "  <cell id=\"cell1\"/>",
  "  <population id=\"pop1\" component=\"cell1\" size=\"10\"/>",
  "  <network id=\"net1\"/>",
  "</neuroml>",
  "",
  "population needs component (a cell id) and a positive size.",
  "The root element is neuroml.",
].join("\n")

export const format: FormatModule = {
  slug: "neuroml",
  displayName: "NeuroML",
  extensions: [".nml", ".neuroml", ".xml"],
  description: "Parse NeuroML cells, populations and networks.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<neuroml xmlns="http://www.neuroml.org/schema/neuroml2" id="demo">',
      '  <cell id="cell1"/>',
      '  <population id="pop1" component="cell1" size="10"/>',
      '  <network id="net1"/>',
      "</neuroml>",
    ].join("\n") + "\n",
}

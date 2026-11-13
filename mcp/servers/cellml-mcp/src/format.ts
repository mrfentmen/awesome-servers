import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

const INTERESTING = new Set(["component", "variable", "reaction", "units", "unit"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "model", "CellML", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const model = tags.find((tag) => tag.name === "model")
  const units = new Set<string>()
  let variables = 0

  for (const tag of tags) {
    if (tag.close) continue
    if (tag.name === "units" && tag.attrs.name) units.add(tag.attrs.name)
    if (tag.name === "variable") {
      variables += 1
      if (!tag.attrs.units) {
        issues.push({ code: "variable-without-units", severity: "error", message: `variable ${tag.attrs.name ?? "?"} has no units attribute`, line: tag.line })
      }
      if (!tag.attrs.name) {
        issues.push({ code: "variable-without-name", severity: "error", message: "variable has no name attribute", line: tag.line })
      }
    }
    if (!INTERESTING.has(tag.name)) continue
    records.push({
      id: `${tag.name}:${tag.attrs.name ?? tag.attrs.reaction ?? records.length + 1}`,
      kind: tag.name,
      fields: {
        name: tag.attrs.name ?? "",
        units: tag.attrs.units ?? "",
        initialValue: tag.attrs.initial_value ?? "",
        line: tag.line,
      },
    })
  }

  if (model && !model.attrs.name) {
    issues.push({ code: "model-without-name", severity: "error", message: "model element has no name attribute", line: model.line })
  }
  if (records.filter((record) => record.kind === "component").length === 0) {
    issues.push({ code: "no-components", severity: "error", message: "Model has no component" })
  }
  for (const record of records) {
    if (record.kind !== "variable") continue
    const declared = String(record.fields.units ?? "")
    if (declared && !units.has(declared) && !["dimensionless", "mV", "ms", "mM", "uA", "nA", "pA", "uF", "nS", "pF", "per_ms", "per_mV"].includes(declared)) {
      issues.push({ code: "unknown-units", severity: "warning", message: `variable ${record.fields.name} uses units ${declared}, which is not declared` })
    }
  }

  return {
    format: "CellML",
    records,
    meta: {
      model: model?.attrs.name ?? "",
      components: records.filter((record) => record.kind === "component").length,
      variables,
      reactions: records.filter((record) => record.kind === "reaction").length,
      units: units.size,
    },
    issues,
  }
}

const reference = [
  "CellML model",
  "",
  "<model name=\"example\" xmlns=\"http://www.cellml.org/cellml/2.0#\">",
  "  <units name=\"mV\"/>",
  "  <component name=\"membrane\">",
  "    <variable name=\"V\" units=\"mV\" initial_value=\"0\"/>",
  "  </component>",
  "</model>",
  "",
  "Every variable needs a name and a units attribute.",
  "Custom units must be declared with a units element.",
].join("\n")

export const format: FormatModule = {
  slug: "cellml",
  displayName: "CellML",
  extensions: [".cellml", ".xml"],
  description: "Parse CellML models, validate components, variables and units.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<model name="demo" xmlns="http://www.cellml.org/cellml/2.0#">',
      '  <units name="mV"/>',
      '  <component name="membrane">',
      '    <variable name="V" units="mV" initial_value="0"/>',
      "  </component>",
      "</model>",
    ].join("\n") + "\n",
}

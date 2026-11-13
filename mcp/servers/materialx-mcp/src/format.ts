import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

const INTERESTING = new Set(["material", "shaderref", "nodegraph", "surfacematerial", "geompropdef", "input"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "materialx", "MaterialX", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const root = tags.find((tag) => tag.name === "materialx")
  const referenced = new Set<string>()

  for (const tag of tags) {
    if (tag.close) continue
    if (tag.name === "shaderref") {
      const name = tag.attrs.name ?? ""
      if (name) referenced.add(name)
    }
    if (!INTERESTING.has(tag.name)) continue
    records.push({
      id: `${tag.name}:${records.length + 1}`,
      kind: tag.name,
      fields: {
        name: tag.attrs.name ?? "",
        type: tag.attrs.type ?? "",
        value: tag.attrs.value ?? "",
        line: tag.line,
      },
    })
  }

  const materials = records.filter((record) => record.kind === "material")
  for (const material of materials) {
    if (!material.fields.name) {
      issues.push({ code: "material-without-name", severity: "error", message: "material element has no name attribute" })
    }
  }
  if (root && !root.attrs.version) {
    issues.push({ code: "no-version", severity: "warning", message: "materialx root has no version attribute", line: root.line })
  }
  if (materials.length === 0) {
    issues.push({ code: "no-material", severity: "error", message: "Document defines no material element" })
  }
  if (referenced.size > 0) {
    const nodes = new Set(records.filter((record) => record.kind === "nodegraph").map((record) => record.fields.name))
    for (const name of referenced) {
      if (!nodes.has(name)) {
        issues.push({ code: "dangling-shaderref", severity: "warning", message: `shaderref points at ${name}, which has no nodegraph` })
      }
    }
  }

  return {
    format: "MaterialX",
    records,
    meta: {
      version: root?.attrs.version ?? "",
      materials: materials.length,
      shaderRefs: records.filter((record) => record.kind === "shaderref").length,
      nodeGraphs: records.filter((record) => record.kind === "nodegraph").length,
      elements: tags.filter((tag) => !tag.close).length,
    },
    issues,
  }
}

const reference = [
  "MaterialX material document",
  "",
  "<materialx version=\"1.38\"> is the root.",
  "<material name=\"M1\"> holds <shaderref name=\"NG1\" type=\"surfacematerial\"/>.",
  "<nodegraph name=\"NG1\"> holds nodes and <input name= type= value=>.",
  "shaderref name must match a nodegraph name.",
  "Version attribute is expected by most tools.",
].join("\n")

export const format: FormatModule = {
  slug: "materialx",
  displayName: "MaterialX",
  extensions: [".mtlx"],
  description: "Parse MaterialX materials, shader refs and node graphs.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<materialx version="1.38">',
      '  <material name="M1">',
      '    <shaderref name="NG1" type="surfacematerial"/>',
      "  </material>",
      '  <nodegraph name="NG1">',
      '    <input name="base_color" type="color3" value="0.8, 0.8, 0.8"/>',
      "  </nodegraph>",
      "</materialx>",
    ].join("\n") + "\n",
}

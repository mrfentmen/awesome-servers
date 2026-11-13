import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "IPC-2581", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const components = new Set<string>()
  const bomRefs: Array<{ ref: string; line: number }> = []
  const ids = new Set<string>()
  let bomItems = 0
  let nets = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "Component") {
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "component-id", severity: "error", message: "Component has no id", line: tag.line })
      else if (components.has(id)) issues.push({ code: "duplicate-component", severity: "error", message: `Duplicate component id ${id}`, line: tag.line })
      else {
        components.add(id)
        records.push({ id: `component:${id}`, kind: "component", fields: { part: tag.attrs.part ?? "", line: tag.line } })
      }
      continue
    }
    if (name === "BomItem") {
      bomItems += 1
      const ref = tag.attrs.componentRef ?? ""
      if (!ref) issues.push({ code: "bom-ref", severity: "error", message: "BomItem has no componentRef", line: tag.line })
      else bomRefs.push({ ref, line: tag.line })
      continue
    }
    if (name === "Net") {
      nets += 1
      const id = tag.attrs.id ?? ""
      if (id && ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `Duplicate id ${id}`, line: tag.line })
      ids.add(id)
      if (id) records.push({ id: `net:${id}`, kind: "net", fields: { line: tag.line } })
    }
  }

  for (const bom of bomRefs) {
    if (!components.has(bom.ref)) issues.push({ code: "unknown-component", severity: "error", message: `BomItem references unknown component ${bom.ref}`, line: bom.line })
  }

  if (local(root) !== "IPC-2581") issues.push({ code: "bad-root", severity: "error", message: `Root must be IPC-2581, found ${root || "nothing"}` })
  if (components.size === 0) issues.push({ code: "no-components", severity: "error", message: "File has no Component" })
  if (bomItems === 0) issues.push({ code: "no-bom", severity: "warning", message: "File has no BomItem" })

  return { format: "IPC-2581", records, meta: { components: components.size, bomItems, nets }, issues }
}

const reference = [
  "IPC-2581 PCB product data",
  "",
  '<IPC-2581 revision="C">',
  "  <Content>",
  "    <Bom><BomItem componentRef=\"R1\"/></Bom>",
  '    <Components><Component id="R1" part="RES-10K"/></Components>',
  '    <Nets><Net id="N1"/></Nets>',
  "  </Content>",
  "</IPC-2581>",
  "",
  "Component ids must be unique.",
  "Every BomItem componentRef must point at a Component.",
  "Nets carry unique ids.",
].join("\n")

export const format: FormatModule = {
  slug: "ipc2581",
  displayName: "IPC-2581",
  extensions: [".xml"],
  description: "Parse IPC-2581 PCB data, validate components, BOM references and nets.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<IPC-2581 revision="C">',
      "  <Content>",
      '    <Bom><BomItem componentRef="R1"/><BomItem componentRef="C1"/></Bom>',
      '    <Components>',
      '      <Component id="R1" part="RES-10K"/>',
      '      <Component id="C1" part="CAP-100N"/>',
      "    </Components>",
      '    <Nets><Net id="N1"/><Net id="N2"/></Nets>',
      "  </Content>",
      "</IPC-2581>",
    ].join("\n") + "\n",
}

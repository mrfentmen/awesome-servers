import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const ROOTS = new Set(["ODX", "ODX-D", "ODX-C", "ODX-V", "ODX-F", "ODX-E"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "ODX file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let containers = 0
  let layers = 0
  let requests = 0
  const layerIds = new Set<string>()

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "DIAG-LAYER-CONTAINER") {
      containers += 1
      records.push({ id: `container:${containers}`, kind: "container", fields: { id: tag.attrs.ID ?? "", line: tag.line } })
      continue
    }
    if (name === "DIAG-LAYER" || name.endsWith("-DIAG-LAYER")) {
      layers += 1
      const id = tag.attrs.ID ?? ""
      if (id && layerIds.has(id)) {
        issues.push({ code: "duplicate-layer", severity: "error", message: `DIAG-LAYER ${id} appears twice`, line: tag.line })
      }
      layerIds.add(id)
      records.push({ id: `layer:${id || layers}`, kind: "layer", fields: { id, line: tag.line } })
      continue
    }
    if (name === "REQUESTS" || name === "POS-RESPONSES" || name === "NEG-RESPONSES") {
      requests += 1
      records.push({ id: `${name}:${requests}`, kind: "service", fields: { name, line: tag.line } })
    }
  }

  if (!ROOTS.has(local(root).toUpperCase())) {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be ODX, ODX-D, ODX-C, ODX-V or ODX-E, found ${root || "nothing"}` })
  }
  if (containers === 0) issues.push({ code: "no-container", severity: "error", message: "File has no DIAG-LAYER-CONTAINER" })
  if (layers === 0) issues.push({ code: "no-layers", severity: "error", message: "File has no DIAG-LAYER" })
  if (requests === 0) issues.push({ code: "no-services", severity: "warning", message: "No request or response objects found" })

  return {
    format: "ODX",
    records,
    meta: { root: local(root), containers, layers, services: requests },
    issues,
  }
}

const reference = [
  "ODX (Open Diagnostic Data Exchange)",
  "",
  "<ODX MODEL-VERSION=\"2.2.0\">",
  "  <DIAG-LAYER-CONTAINER ID=\"dlc\">",
  "    <SHORT-NAME>Container</SHORT-NAME>",
  "    <DIAG-LAYERS>",
  "      <DIAG-LAYER ID=\"dl1\"><SHORT-NAME>Engine</SHORT-NAME></DIAG-LAYER>",
  "    </DIAG-LAYERS>",
  "  </DIAG-LAYER-CONTAINER>",
  "</ODX>",
  "",
  "Root is ODX or a variant such as ODX-D or ODX-C.",
  "DIAG-LAYER-CONTAINER holds DIAG-LAYERs; layer IDs must be unique.",
  "Services appear in REQUESTS and POS-RESPONSES.",
].join("\n")

export const format: FormatModule = {
  slug: "odx",
  displayName: "ODX",
  extensions: [".odx"],
  description: "Parse ODX diagnostic files, validate layers, containers and services.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<ODX MODEL-VERSION="2.2.0">',
      '  <DIAG-LAYER-CONTAINER ID="dlc">',
      "    <SHORT-NAME>Container</SHORT-NAME>",
      "    <DIAG-LAYERS>",
      '      <DIAG-LAYER ID="dl1"><SHORT-NAME>Engine</SHORT-NAME></DIAG-LAYER>',
      "    </DIAG-LAYERS>",
      "  </DIAG-LAYER-CONTAINER>",
      "</ODX>",
    ].join("\n") + "\n",
}

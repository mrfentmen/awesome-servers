import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const NODE_TYPES = new Set(["UAObject", "UAVariable", "UAMethod", "UAObjectType", "UAVariableType", "UADataType", "UAReferenceType"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "OPC UA NodeSet", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const nodeIds = new Set<string>()
  let nodes = 0
  let namespaces = 0
  let references = 0
  let aliases = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "Uri") {
      namespaces += 1
      continue
    }
    if (name === "Alias") {
      aliases += 1
      continue
    }
    if (name === "Reference") {
      references += 1
      if (!tag.attrs.ReferenceType) issues.push({ code: "no-reference-type", severity: "error", message: "Reference has no ReferenceType", line: tag.line })
      continue
    }
    if (!NODE_TYPES.has(name)) continue
    nodes += 1
    const nodeId = tag.attrs.NodeId ?? ""
    const browse = tag.attrs.BrowseName ?? ""
    if (!nodeId) {
      issues.push({ code: "no-node-id", severity: "error", message: `${name} has no NodeId`, line: tag.line })
    } else if (!/^ns=\d+;[isgb]=.+$/.test(nodeId)) {
      issues.push({ code: "bad-node-id", severity: "error", message: `Bad NodeId syntax: ${nodeId}`, line: tag.line })
    } else if (nodeIds.has(nodeId)) {
      issues.push({ code: "duplicate-node-id", severity: "error", message: `Duplicate NodeId ${nodeId}`, line: tag.line })
    } else {
      nodeIds.add(nodeId)
    }
    if (!browse) issues.push({ code: "no-browse-name", severity: "warning", message: `${nodeId || name} has no BrowseName`, line: tag.line })
    records.push({ id: nodeId || `node:${nodes}`, kind: name, fields: { browse, line: tag.line } })
  }

  if (local(root) !== "UANodeSet") issues.push({ code: "bad-root", severity: "error", message: `Root must be UANodeSet, found ${root || "nothing"}` })
  if (nodes === 0) issues.push({ code: "no-nodes", severity: "error", message: "File has no UA nodes" })
  if (namespaces === 0) issues.push({ code: "no-namespaces", severity: "warning", message: "NodeSet has no NamespaceUris" })

  return { format: "NodeSet", records, meta: { nodes, namespaces, references, aliases }, issues }
}

const reference = [
  "OPC UA NodeSet2",
  "",
  '<UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">',
  "  <NamespaceUris><Uri>http://example.com/demo</Uri></NamespaceUris>",
  "  <Aliases><Alias Alias=\"HasComponent\">i=47</Alias></Aliases>",
  '  <UAObject NodeId="ns=1;i=1" BrowseName="1:Demo">',
  '    <References><Reference ReferenceType="HasComponent">ns=1;i=2</Reference></References>',
  "  </UAObject>",
  '  <UAVariable NodeId="ns=1;i=2" BrowseName="1:Value" DataType="Double"/>',
  "</UANodeSet>",
  "",
  "NodeId must look like ns=<n>;<i|s|g|b>=<value>.",
  "NodeIds are unique inside a NodeSet.",
  "References need a ReferenceType.",
].join("\n")

export const format: FormatModule = {
  slug: "nodeset",
  displayName: "NodeSet",
  extensions: [".xml"],
  description: "Parse OPC UA NodeSets, validate NodeIds, nodes and references.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">',
      "  <NamespaceUris><Uri>http://example.com/demo</Uri></NamespaceUris>",
      '  <Aliases><Alias Alias="HasComponent">i=47</Alias></Aliases>',
      '  <UAObject NodeId="ns=1;i=1" BrowseName="1:Demo">',
      '    <References><Reference ReferenceType="HasComponent">ns=1;i=2</Reference></References>',
      "  </UAObject>",
      '  <UAVariable NodeId="ns=1;i=2" BrowseName="1:Value" DataType="Double"/>',
      "</UANodeSet>",
    ].join("\n") + "\n",
}

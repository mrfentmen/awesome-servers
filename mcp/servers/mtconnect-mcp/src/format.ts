import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const ROOTS = new Set(["MTConnectDevices", "MTConnectStreams", "MTConnectAssets", "MTConnectError"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "MTConnect document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const deviceIds = new Set<string>()
  let devices = 0
  let components = 0
  let dataItems = 0
  let header = false

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "Header") {
      header = true
      if (!tag.attrs.creationTime) issues.push({ code: "header-without-time", severity: "warning", message: "Header has no creationTime", line: tag.line })
      if (!tag.attrs.version) issues.push({ code: "header-without-version", severity: "warning", message: "Header has no version", line: tag.line })
      records.push({ id: "header", kind: "header", fields: { creationTime: tag.attrs.creationTime ?? "", version: tag.attrs.version ?? "", line: tag.line } })
      continue
    }
    if (name === "Device") {
      devices += 1
      const id = tag.attrs.id ?? ""
      const uuid = tag.attrs.uuid ?? ""
      if (!id) issues.push({ code: "device-without-id", severity: "error", message: "Device has no id", line: tag.line })
      if (uuid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
        issues.push({ code: "bad-uuid", severity: "error", message: `Device uuid is not a UUID: ${uuid}`, line: tag.line })
      }
      if (deviceIds.has(id)) issues.push({ code: "duplicate-device", severity: "error", message: `Device ${id} appears twice`, line: tag.line })
      deviceIds.add(id)
      records.push({ id: `device:${id || devices}`, kind: "device", fields: { id, name: tag.attrs.name ?? "", uuid, line: tag.line } })
      continue
    }
    if (name === "Components" || name === "Axes" || name === "Controller") {
      components += 1
      records.push({ id: `component:${components}`, kind: "component", fields: { type: name, line: tag.line } })
      continue
    }
    if (["DataItem", "DataItemDescription", "Sample", "Observation"].includes(name)) {
      dataItems += 1
      records.push({ id: `data:${dataItems}`, kind: "dataItem", fields: { id: tag.attrs.id ?? "", type: tag.attrs.type ?? "", line: tag.line } })
    }
  }

  if (!ROOTS.has(local(root))) {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be MTConnectDevices, Streams, Assets or Error, found ${root || "nothing"}` })
  }
  if (!header) issues.push({ code: "no-header", severity: "error", message: "Document has no Header" })
  if (local(root) === "MTConnectDevices" && devices === 0) {
    issues.push({ code: "no-devices", severity: "error", message: "Devices document has no Device" })
  }

  return {
    format: "MTConnect",
    records,
    meta: { root: local(root), devices, components, dataItems, header },
    issues,
  }
}

const reference = [
  "MTConnect device document (XML)",
  "",
  "<MTConnectDevices>",
  "  <Header creationTime=\"2026-11-12T10:00:00Z\" sender=\"agent\" instanceId=\"1\" version=\"1.7.0\"/>",
  "  <Devices>",
  "    <Device id=\"d1\" name=\"Mill\" uuid=\"12345678-1234-1234-1234-123456789012\"/>",
  "  </Devices>",
  "</MTConnectDevices>",
  "",
  "Root is MTConnectDevices, MTConnectStreams, MTConnectAssets or MTConnectError.",
  "Header carries creationTime and version.",
  "Devices need an id; uuid must be a valid UUID.",
].join("\n")

export const format: FormatModule = {
  slug: "mtconnect",
  displayName: "MTConnect",
  extensions: [".xml"],
  description: "Parse MTConnect documents, validate headers, devices and data items.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<MTConnectDevices>",
      '  <Header creationTime="2026-11-12T10:00:00Z" sender="agent" instanceId="1" version="1.7.0"/>',
      "  <Devices>",
      '    <Device id="d1" name="Mill" uuid="12345678-1234-1234-1234-123456789012"/>',
      "  </Devices>",
      "</MTConnectDevices>",
    ].join("\n") + "\n",
}

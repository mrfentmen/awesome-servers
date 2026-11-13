import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "GSDML file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let profiles = 0
  let daps = 0
  let modules = 0
  let submodules = 0
  let vendorId = ""
  let deviceId = ""

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "ProfileBody") {
      profiles += 1
      continue
    }
    if (name === "DeviceIdentity") {
      vendorId = tag.attrs.VendorID ?? ""
      deviceId = tag.attrs.DeviceID ?? ""
      if (!vendorId || !deviceId) {
        issues.push({ code: "identity-incomplete", severity: "error", message: "DeviceIdentity needs VendorID and DeviceID", line: tag.line })
      }
      continue
    }
    const bucket =
      name === "DeviceAccessPointItem" ? "dap" :
      name === "ModuleItem" ? "module" :
      name === "SubmoduleItem" || name === "VirtualSubmoduleItem" ? "submodule" : ""
    if (!bucket) continue
    if (bucket === "dap") daps += 1
    if (bucket === "module") modules += 1
    if (bucket === "submodule") submodules += 1
    const id = tag.attrs.ID ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `ID ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `${bucket}:${id || records.length}`, kind: bucket, fields: { id, line: tag.line } })
  }

  const rootName = local(root)
  if (rootName !== "ISO15745Profile") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be ISO15745Profile, found ${rootName || "nothing"}` })
  }
  if (profiles === 0) issues.push({ code: "no-profile-body", severity: "error", message: "File has no ProfileBody" })
  if (daps === 0) issues.push({ code: "no-dap", severity: "error", message: "File has no DeviceAccessPointItem" })
  if (modules === 0) issues.push({ code: "no-modules", severity: "warning", message: "File has no ModuleItem" })

  return {
    format: "GSDML",
    records,
    meta: { root: rootName, vendorId, deviceId, daps, modules, submodules },
    issues,
  }
}

const reference = [
  "PROFINET GSDML device description",
  "",
  '<ISO15745Profile xmlns="http://www.profibus.com/GSDML/2006/Oct">',
  "  <ProfileBody>",
  '    <DeviceIdentity VendorID="0x1234" DeviceID="0x5678"/>',
  "    <DeviceAccessPointList>",
  '      <DeviceAccessPointItem ID="DAP1" PhysicalSlots="0..5"/>',
  "    </DeviceAccessPointList>",
  "    <ModuleList>",
  '      <ModuleItem ID="M1" ModuleIdentNumber="0x00000001"/>',
  "    </ModuleList>",
  "  </ProfileBody>",
  "</ISO15745Profile>",
  "",
  "Root is ISO15745Profile.",
  "DeviceIdentity carries VendorID and DeviceID.",
  "At least one DeviceAccessPointItem is required.",
].join("\n")

export const format: FormatModule = {
  slug: "gsdml",
  displayName: "GSDML",
  extensions: [".xml", ".gsdml"],
  description: "Parse PROFINET GSDML files, validate identity, access points and modules.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<ISO15745Profile xmlns="http://www.profibus.com/GSDML/2006/Oct">',
      "  <ProfileBody>",
      '    <DeviceIdentity VendorID="0x1234" DeviceID="0x5678"/>',
      "    <DeviceAccessPointList>",
      '      <DeviceAccessPointItem ID="DAP1" PhysicalSlots="0..5"/>',
      "    </DeviceAccessPointList>",
      "    <ModuleList>",
      '      <ModuleItem ID="M1" ModuleIdentNumber="0x00000001"/>',
      "    </ModuleList>",
      "  </ProfileBody>",
      "</ISO15745Profile>",
    ].join("\n") + "\n",
}

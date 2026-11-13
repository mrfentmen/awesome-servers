import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "AUTOSAR file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let packages = 0
  let components = 0
  let shortNames = 0
  let inPackage = false

  for (const tag of tags) {
    if (tag.close) {
      if (local(tag.name) === "AR-PACKAGE") inPackage = false
      continue
    }
    const name = local(tag.name)
    if (name === "AR-PACKAGE") {
      packages += 1
      inPackage = true
      records.push({ id: `package:${packages}`, kind: "package", fields: { line: tag.line } })
      continue
    }
    if (name === "SHORT-NAME") {
      shortNames += 1
      if (inPackage) records.push({ id: `short:${shortNames}`, kind: "shortName", fields: { line: tag.line } })
      continue
    }
    if (name.endsWith("SW-COMPONENT-TYPE") || name.endsWith("SERVICE-INTERFACE") || name.endsWith("SENDER-RECEIVER-INTERFACE")) {
      components += 1
      records.push({ id: `element:${components}`, kind: "element", fields: { type: name, line: tag.line } })
    }
  }

  if (local(root) !== "AUTOSAR") {
    issues.push({ code: "bad-root", severity: "error", message: `Root element must be AUTOSAR, found ${root || "nothing"}` })
  }
  if (packages === 0) issues.push({ code: "no-packages", severity: "error", message: "File has no AR-PACKAGE" })
  if (shortNames === 0) issues.push({ code: "no-short-name", severity: "warning", message: "File has no SHORT-NAME" })
  if (components === 0) issues.push({ code: "no-elements", severity: "warning", message: "No software component or interface element found" })

  return {
    format: "AUTOSAR ARXML",
    records,
    meta: { root: local(root), packages, components, shortNames },
    issues,
  }
}

const reference = [
  "AUTOSAR ARXML",
  "",
  "<AUTOSAR xmlns=\"http://autosar.org/schema/r4.0\">",
  "  <AR-PACKAGES>",
  "    <AR-PACKAGE>",
  "      <SHORT-NAME>Demo</SHORT-NAME>",
  "      <ELEMENTS>",
  "        <APPLICATION-SW-COMPONENT-TYPE>",
  "          <SHORT-NAME>App</SHORT-NAME>",
  "        </APPLICATION-SW-COMPONENT-TYPE>",
  "      </ELEMENTS>",
  "    </AR-PACKAGE>",
  "  </AR-PACKAGES>",
  "</AUTOSAR>",
  "",
  "The root is AUTOSAR; content sits inside AR-PACKAGES.",
  "Every package and element carries a SHORT-NAME.",
  "Namespaces such as ar: are ignored when matching element names.",
].join("\n")

export const format: FormatModule = {
  slug: "autosar-arxml",
  displayName: "AUTOSAR ARXML",
  extensions: [".arxml"],
  description: "Parse AUTOSAR ARXML, validate root, packages, components and short names.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<AUTOSAR xmlns="http://autosar.org/schema/r4.0">',
      "  <AR-PACKAGES>",
      "    <AR-PACKAGE>",
      "      <SHORT-NAME>Demo</SHORT-NAME>",
      "      <ELEMENTS>",
      "        <APPLICATION-SW-COMPONENT-TYPE>",
      "          <SHORT-NAME>App</SHORT-NAME>",
      "        </APPLICATION-SW-COMPONENT-TYPE>",
      "      </ELEMENTS>",
      "    </AR-PACKAGE>",
      "  </AR-PACKAGES>",
      "</AUTOSAR>",
    ].join("\n") + "\n",
}

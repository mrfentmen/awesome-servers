import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "DTS:Executable", "SSIS package", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const names = new Set<string>()
  const root = tags.find((tag) => !tag.close)
  let executables = 0
  let connections = 0
  let variables = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = tag.attrs["DTS:Executable.Name"] ?? tag.attrs["DTS:ConnectionManager.Name"] ?? tag.attrs["DTS:Variable.Name"] ?? tag.attrs["DTS:PrecedenceConstraint.Name"]

    if (tag.name === "DTS:Executable") {
      executables += 1
      if (tag !== root && !name) {
        issues.push({ code: "executable-without-name", severity: "error", message: "Nested executable has no DTS:Executable.Name", line: tag.line })
      }
    }
    if (tag.name === "DTS:ConnectionManager") {
      connections += 1
      if (!name) issues.push({ code: "connection-without-name", severity: "error", message: "ConnectionManager has no name", line: tag.line })
    }
    if (tag.name === "DTS:Variable") {
      variables += 1
      if (!name) issues.push({ code: "variable-without-name", severity: "error", message: "Variable has no name", line: tag.line })
    }
    if (!["DTS:Executable", "DTS:ConnectionManager", "DTS:Variable", "DTS:PrecedenceConstraint"].includes(tag.name)) continue

    if (name) {
      if (names.has(name)) {
        issues.push({ code: "duplicate-name", severity: "error", message: `Package object ${name} appears twice`, line: tag.line })
      }
      names.add(name)
    }
    records.push({
      id: `${tag.name}:${name ?? records.length + 1}`,
      kind: tag.name.replace("DTS:", "").toLowerCase(),
      fields: { name: name ?? "", type: tag.attrs["DTS:ExecutableType"] ?? "", line: tag.line },
    })
  }

  if (!root || root.name !== "DTS:Executable") {
    issues.push({ code: "no-package", severity: "error", message: "Document has no DTS:Executable package root" })
  }
  if (connections === 0) {
    issues.push({ code: "no-connections", severity: "warning", message: "Package declares no connection manager" })
  }

  return {
    format: "SSIS",
    records,
    meta: {
      executables,
      connections,
      variables,
      precedenceConstraints: records.filter((record) => record.kind === "precedenceconstraint").length,
    },
    issues,
  }
}

const reference = [
  "SSIS package (DTSX)",
  "",
  "<DTS:Executable xmlns:DTS=\"www.microsoft.com/SqlServer/Dts\" DTS:ExecutableType=\"MSDTS.Package\">",
  "  <DTS:ConnectionManager DTS:ConnectionManager.Name=\"Local\"/>",
  "  <DTS:Variable DTS:Variable.Name=\"Count\" DTS:Variable.Value=\"1\"/>",
  "  <DTS:Executable DTS:Executable.Name=\"Load\"/>",
  "</DTS:Executable>",
  "",
  "The root is a DTS:Executable with type MSDTS.Package.",
  "Connection managers, variables and tasks need a name.",
  "Object names must be unique inside a package.",
].join("\n")

export const format: FormatModule = {
  slug: "ssis",
  displayName: "SSIS",
  extensions: [".dtsx"],
  description: "Parse SSIS DTSX packages, validate executables, connections and variables.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<DTS:Executable xmlns:DTS="www.microsoft.com/SqlServer/Dts" DTS:ExecutableType="MSDTS.Package">',
      '  <DTS:ConnectionManager DTS:ConnectionManager.Name="Local"/>',
      '  <DTS:Variable DTS:Variable.Name="Count" DTS:Variable.Value="1"/>',
      '  <DTS:Executable DTS:Executable.Name="Load"/>',
      "</DTS:Executable>",
    ].join("\n") + "\n",
}

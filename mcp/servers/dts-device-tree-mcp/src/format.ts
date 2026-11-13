import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

interface OpenNode {
  name: string
  path: string
  depth: number
  startLine: number
  properties: number
  hasCompatible: boolean
}

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  const includes: string[] = []
  const stack: OpenNode[] = []
  const nodes: Array<{ path: string; compatible: string; properties: number; depth: number }> = []

  let pending = ""
  let pendingLine = 0
  const lines = text.split(/\r?\n/)

  const flush = (statement: string, line: number): void => {
    const trimmed = statement.trim()
    if (trimmed.length === 0) return

    if (trimmed.startsWith("/dts-v1/") || trimmed.startsWith("/plugin/")) return

    const include = /^\/include\/\s+"([^"]+)"/.exec(trimmed)
    if (include) {
      includes.push(include[1])
      return
    }

    if (/^(compatible|model|status|reg|phandle|interrupts|clocks|#address-cells|#size-cells)\s*=/.test(trimmed) || trimmed.includes("=")) {
      const eq = trimmed.indexOf("=")
      if (eq === -1) {
        issues.push({ code: "bad-property", severity: "error", message: `Property has no = : ${trimmed}`, line })
        return
      }
      const name = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).replace(/;$/, "").trim()
      if (name.length === 0 || /\s/.test(name)) {
        issues.push({ code: "bad-property-name", severity: "error", message: `Invalid property name: ${name}`, line })
      }
      if (stack.length === 0) {
        issues.push({ code: "property-outside-root", severity: "error", message: `Property ${name} is outside any node`, line })
      }
      const parent = stack[stack.length - 1]
      if (parent) {
        parent.properties += 1
        if (name === "compatible") parent.hasCompatible = true
        records.push({
          id: `${parent.path}/${name}`,
          kind: "property",
          fields: { node: parent.path, name, value, line },
        })
      }
      return
    }

    issues.push({ code: "loose-statement", severity: "warning", message: `Statement is not a property: ${trimmed}`, line })
  }

  lines.forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "").trim()
    if (line.length === 0) {
      pending = ""
      return
    }

    if (line.includes("{") && line.endsWith("{")) {
      const name = line.slice(0, line.length - 1).trim()
      const parent = stack[stack.length - 1]
      const nodePath = parent ? `${parent.path}/${name}` : `/${name}`
      if (name.length === 0) {
        issues.push({ code: "unnamed-node", severity: "error", message: "Node has no name", line: number })
      }
      const node: OpenNode = {
        name,
        path: nodePath,
        depth: stack.length,
        startLine: number,
        properties: 0,
        hasCompatible: false,
      }
      stack.push(node)
      records.push({ id: nodePath, kind: "node", fields: { name, depth: node.depth, line: number } })
      return
    }

    if (line.startsWith("}")) {
      const closed = stack.pop()
      if (!closed) {
        issues.push({ code: "unmatched-close", severity: "error", message: "Closing brace without an open node", line: number })
        return
      }
      nodes.push({ path: closed.path, compatible: closed.hasCompatible ? "yes" : "no", properties: closed.properties, depth: closed.depth })
      if (!closed.hasCompatible && closed.depth > 0) {
        issues.push({
          code: "missing-compatible",
          severity: "warning",
          message: `Node ${closed.path} has no compatible property`,
          line: closed.startLine,
        })
      }
      if (line.length > 1) flush(line.slice(1), number)
      return
    }

    pending = pending.length > 0 ? `${pending} ${line}` : line
    if (pendingLine === 0) pendingLine = number
    if (pending.endsWith(";")) {
      flush(pending, pendingLine)
      pending = ""
      pendingLine = 0
    }
  })

  if (pending.length > 0) {
    issues.push({ code: "missing-semicolon", severity: "error", message: `Statement is not terminated with ; : ${pending}`, line: pendingLine })
  }
  for (const open of stack) {
    issues.push({
      code: "unclosed-node",
      severity: "error",
      message: `Node ${open.path} opened at line ${open.startLine} is never closed`,
      line: open.startLine,
    })
  }

  const root = records.find((record) => record.kind === "node")
  meta.nodes = nodes.length
  meta.properties = records.filter((record) => record.kind === "property").length
  meta.includes = includes.length
  meta.root = root?.id ?? ""
  meta.maxDepth = nodes.reduce((max, node) => Math.max(max, node.depth), 0)

  return { format: "Device Tree", records, meta, issues }
}

const reference = [
  "Device Tree source (DTS)",
  "",
  "/dts-v1/;",
  "/ {",
  "  model = \"Example\";",
  "  compatible = \"vendor,board\";",
  "  soc {",
  "    uart0: serial@1000 {",
  "      compatible = \"vendor,uart\";",
  "      reg = <0x1000 0x100>;",
  "    };",
  "  };",
  "};",
  "",
  "Nodes are name { ... }; and may carry a label before the name.",
  "Properties are name = value; and must end with a semicolon.",
  "Phandles are written <&label> or <0x1>.",
  "/include/ \"file.dtsi\" pulls in another file.",
].join("\n")

export const format: FormatModule = {
  slug: "dts-device-tree",
  displayName: "Device Tree",
  extensions: [".dts", ".dtsi"],
  description: "Parse Device Tree nodes and properties, validate braces and compatible strings.",
  reference,
  parse,
  sample: () =>
    [
      "/dts-v1/;",
      "/ {",
      '  model = "Example Board";',
      '  compatible = "vendor,board";',
      "  soc {",
      "    uart0: serial@1000 {",
      '      compatible = "vendor,uart";',
      "      reg = <0x1000 0x100>;",
      "    };",
      "  };",
      "};",
    ].join("\n") + "\n",
}

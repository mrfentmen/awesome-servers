import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const nodes = new Set<string>()
  const edges: Array<{ from: string; to: string; line: number }> = []
  let sawGraph = false
  let sawEnd = false

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return

    if (/^graph$/i.test(line)) {
      sawGraph = true
      records.push({ id: "graph", kind: "graph", fields: { line: number } })
      return
    }
    if (/^end$/i.test(line)) {
      sawEnd = true
      return
    }

    const edge = /^([\w.]+)\s*->\s*([\w.]+)$/.exec(line)
    if (edge) {
      edges.push({ from: edge[1], to: edge[2], line: number })
      return
    }

    const input = /^(input|output)\s+file\s+([\w.]+)/i.exec(line)
    if (input) {
      nodes.add(input[2])
      records.push({ id: `file:${input[2]}`, kind: input[1].toLowerCase(), fields: { name: input[2], line: number } })
      return
    }

    const component = /^component\s+([\w.]+)\s+([\w.]+)/i.exec(line)
    if (component) {
      nodes.add(component[2])
      records.push({ id: `component:${component[2]}`, kind: "component", fields: { type: component[1], name: component[2], line: number } })
      return
    }

    const shorthand = /^(?:reformat|sort|filter|join|rollup|scan|gather|dedup|normalize|partition|broadcast)\s+([\w.]+)$/i.exec(line)
    if (shorthand) {
      nodes.add(shorthand[1])
      records.push({ id: `component:${shorthand[1]}`, kind: "component", fields: { type: line.split(/\s+/)[0], name: shorthand[1], line: number } })
      return
    }

    issues.push({ code: "unknown-directive", severity: "warning", message: `Unknown graph directive: ${line.slice(0, 40)}`, line: number })
  })

  for (const edge of edges) {
    if (!nodes.has(edge.from)) {
      issues.push({ code: "unknown-node", severity: "error", message: `Edge starts at ${edge.from}, which is not defined`, line: edge.line })
    }
    if (!nodes.has(edge.to)) {
      issues.push({ code: "unknown-node", severity: "error", message: `Edge ends at ${edge.to}, which is not defined`, line: edge.line })
    }
    const id = `edge:${edge.from}->${edge.to}`
    records.push({ id, kind: "edge", fields: { from: edge.from, to: edge.to, line: edge.line } })
  }

  if (!sawGraph) {
    issues.push({ code: "no-graph", severity: "error", message: "File does not start with the graph keyword" })
  }
  if (!sawEnd) {
    issues.push({ code: "no-end", severity: "warning", message: "Graph has no final end" })
  }
  if (nodes.size === 0) {
    issues.push({ code: "no-nodes", severity: "error", message: "Graph declares no components or files" })
  }

  return {
    format: "Ab Initio",
    records,
    meta: {
      nodes: nodes.size,
      components: records.filter((record) => record.kind === "component").length,
      files: records.filter((record) => record.kind === "input" || record.kind === "output").length,
      edges: edges.length,
    },
    issues,
  }
}

const reference = [
  "Ab Initio graph (.mp)",
  "",
  "graph",
  "  input file in1",
  "  output file out1",
  "  component Reformat rf1",
  "  edge in1 rf1",
  "  edge rf1 out1",
  "end",
  "",
  "graph opens the graph and end closes it.",
  "input file and output file declare ports.",
  "component TYPE NAME declares a transform.",
  "Edges use edge A B or A -> B, and both ends must exist.",
].join("\n")

export const format: FormatModule = {
  slug: "ab-initio",
  displayName: "Ab Initio",
  extensions: [".mp"],
  description: "Parse Ab Initio graphs, validate components, ports and edges.",
  reference,
  parse,
  sample: () =>
    [
      "graph",
      "  input file in1",
      "  output file out1",
      "  component Reformat rf1",
      "  edge in1 rf1",
      "  edge rf1 out1",
      "end",
    ].join("\n") + "\n",
}

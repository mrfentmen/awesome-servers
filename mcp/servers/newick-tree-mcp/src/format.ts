import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const source = text.trim()

  if (source.length === 0) {
    issues.push({ code: "empty", severity: "error", message: "Document is empty" })
    return { format: "Newick", records, meta: {}, issues }
  }

  let index = 0
  let counter = 0
  let maxDepth = 0
  let totalLength = 0
  const taxa: string[] = []

  if (!source.endsWith(";")) {
    issues.push({ code: "missing-semicolon", severity: "warning", message: "Newick tree should end with ;" })
  }

  function readLabel(): string {
    let out = ""
    while (index < source.length && !"(),:;".includes(source[index])) {
      out += source[index]
      index += 1
    }
    return out.trim()
  }

  function readLength(id: string): number | null {
    if (source[index] !== ":") return null
    index += 1
    let out = ""
    while (index < source.length && !",);".includes(source[index])) {
      out += source[index]
      index += 1
    }
    const value = Number(out)
    if (!Number.isFinite(value) || out.trim().length === 0) {
      issues.push({ code: "bad-branch-length", severity: "error", message: `Node ${id} has a non numeric branch length: ${out}` })
      return null
    }
    return value
  }

  function readNode(depth: number): string {
    counter += 1
    const id = `n${counter}`
    maxDepth = Math.max(maxDepth, depth)

    if (source[index] === "(") {
      index += 1
      const children: string[] = []
      for (;;) {
        if (index >= source.length) {
          issues.push({ code: "unclosed-group", severity: "error", message: `Node ${id} has no closing parenthesis` })
          break
        }
        children.push(readNode(depth + 1))
        if (source[index] === ",") {
          index += 1
          continue
        }
        break
      }
      if (source[index] === ")") index += 1
      else issues.push({ code: "unclosed-group", severity: "error", message: `Node ${id} has no closing parenthesis` })

      const label = readLabel()
      const length = readLength(id)
      if (length !== null) totalLength += length
      records.push({
        id,
        kind: "internal",
        fields: { label, length, childCount: children.length, children: children.join(","), depth },
      })
      return id
    }

    const label = readLabel()
    if (label.length === 0) {
      issues.push({ code: "missing-label", severity: "error", message: `Leaf ${id} has no taxon label` })
    } else {
      taxa.push(label)
    }
    const length = readLength(id)
    if (length !== null) totalLength += length
    records.push({ id, kind: "leaf", fields: { label, length, depth } })
    return id
  }

  readNode(0)

  while (index < source.length && /\s/.test(source[index])) index += 1
  if (index < source.length && source[index] !== ";") {
    issues.push({ code: "trailing-text", severity: "error", message: `Unexpected text after the tree: ${source.slice(index, index + 20)}` })
  }

  return {
    format: "Newick",
    records,
    meta: {
      taxa: taxa.length,
      internalNodes: records.filter((record) => record.kind === "internal").length,
      maxDepth,
      totalBranchLength: Math.round(totalLength * 1000) / 1000,
    },
    issues,
  }
}

const reference = [
  "Newick tree format",
  "",
  "A tree is nodes separated by commas, wrapped in parentheses, ending with ;",
  "  ((A:0.1,B:0.2)AB:0.3,C:0.4);",
  "A label after a closing parenthesis names the clade.",
  "Branch lengths follow a colon and must be numeric.",
  "Semicolon terminates the tree. Whitespace is ignored.",
].join("\n")

export const format: FormatModule = {
  slug: "newick-tree",
  displayName: "Newick",
  extensions: [".nwk", ".newick", ".tree"],
  description: "Parse Newick trees, list taxa and clades, validate branch lengths.",
  reference,
  parse,
  sample: () => "((A:0.1,B:0.2)AB:0.3,C:0.4);\n",
}

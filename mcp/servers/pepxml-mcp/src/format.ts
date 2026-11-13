import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "pepXML file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let queries = 0
  let hits = 0
  let runs = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "msms_run_summary") {
      runs += 1
      if (!tag.attrs.base_name) issues.push({ code: "no-base-name", severity: "warning", message: "msms_run_summary has no base_name", line: tag.line })
      continue
    }
    if (name === "spectrum_query") {
      queries += 1
      if (!tag.attrs.spectrum) issues.push({ code: "query-without-spectrum", severity: "error", message: "spectrum_query has no spectrum", line: tag.line })
      if (tag.attrs.index && !/^\d+$/.test(tag.attrs.index)) {
        issues.push({ code: "bad-index", severity: "error", message: `index must be numeric: ${tag.attrs.index}`, line: tag.line })
      }
      records.push({ id: `query:${tag.attrs.index ?? queries}`, kind: "query", fields: { spectrum: tag.attrs.spectrum ?? "", line: tag.line } })
      continue
    }
    if (name === "search_hit") {
      hits += 1
      if (!tag.attrs.peptide) issues.push({ code: "hit-without-peptide", severity: "error", message: "search_hit has no peptide", line: tag.line })
      records.push({ id: `hit:${hits}`, kind: "hit", fields: { peptide: tag.attrs.peptide ?? "", line: tag.line } })
    }
  }

  if (local(root) !== "msms_pipeline_analysis") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be msms_pipeline_analysis, found ${root || "nothing"}` })
  }
  if (runs === 0) issues.push({ code: "no-runs", severity: "error", message: "File has no msms_run_summary" })
  if (queries === 0) issues.push({ code: "no-queries", severity: "error", message: "File has no spectrum_query" })
  if (hits === 0) issues.push({ code: "no-hits", severity: "warning", message: "File has no search_hit" })

  return {
    format: "pepXML",
    records,
    meta: { runs, queries, hits },
    issues,
  }
}

const reference = [
  "pepXML peptide search results",
  "",
  '<msms_pipeline_analysis xmlns="http://regis-web.systemsbiology.net/schema/pepXML">',
  '  <msms_run_summary base_name="run1">',
  '    <spectrum_query spectrum="run1.0001.0001.2" index="1">',
  "      <search_result>",
  '        <search_hit hit_rank="1" peptide="PEPTIDE"/>',
  "      </search_result>",
  "    </spectrum_query>",
  "  </msms_run_summary>",
  "</msms_pipeline_analysis>",
  "",
  "Root is msms_pipeline_analysis.",
  "spectrum_query needs a spectrum name.",
  "search_hit needs a peptide.",
].join("\n")

export const format: FormatModule = {
  slug: "pepxml",
  displayName: "pepXML",
  extensions: [".pepxml"],
  description: "Parse pepXML results, validate runs, spectrum queries and hits.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<msms_pipeline_analysis xmlns="http://regis-web.systemsbiology.net/schema/pepXML">',
      '  <msms_run_summary base_name="run1">',
      '    <spectrum_query spectrum="run1.0001.0001.2" index="1">',
      "      <search_result>",
      '        <search_hit hit_rank="1" peptide="PEPTIDE"/>',
      "      </search_result>",
      "    </spectrum_query>",
      "  </msms_run_summary>",
      "</msms_pipeline_analysis>",
    ].join("\n") + "\n",
}

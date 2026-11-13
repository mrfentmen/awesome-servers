import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "mzIdentML file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const counts = { sequences: 0, peptides: 0, evidence: 0, results: 0, items: 0 }

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    const bucket =
      name === "DBSequence" ? "sequences" :
      name === "Peptide" ? "peptides" :
      name === "PeptideEvidence" ? "evidence" :
      name === "SpectrumIdentificationResult" ? "results" :
      name === "SpectrumIdentificationItem" ? "items" : ""
    if (!bucket) continue
    counts[bucket] += 1
    const id = tag.attrs.id ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `id ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `${name}:${id || records.length}`, kind: name, fields: { id, line: tag.line } })
  }

  if (local(root) !== "MzIdentML") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be MzIdentML, found ${root || "nothing"}` })
  }
  if (counts.peptides === 0) issues.push({ code: "no-peptides", severity: "error", message: "File has no Peptide" })
  if (counts.results === 0) issues.push({ code: "no-results", severity: "error", message: "File has no SpectrumIdentificationResult" })

  return {
    format: "mzIdentML",
    records,
    meta: counts,
    issues,
  }
}

const reference = [
  "mzIdentML proteomics results",
  "",
  '<MzIdentML xmlns="http://psidev.info/psi/pi/mzIdentML/1.1">',
  '  <SequenceCollection>',
  '    <DBSequence id="DB1" accession="P12345"/>',
  '    <Peptide id="PEP1"><PeptideSequence>PEPTIDE</PeptideSequence></Peptide>',
  '    <PeptideEvidence id="PE1" peptide_ref="PEP1" dBSequence_ref="DB1"/>',
  "  </SequenceCollection>",
  '  <DataCollection><AnalysisData><SpectrumIdentificationList>',
  '    <SpectrumIdentificationResult id="SIR1" spectrumID="scan=1"/>',
  "    </SpectrumIdentificationList></AnalysisData></DataCollection>",
  "</MzIdentML>",
  "",
  "Root is MzIdentML.",
  "Peptides and results are required.",
  "IDs are unique across the document.",
].join("\n")

export const format: FormatModule = {
  slug: "mzidentml",
  displayName: "mzIdentML",
  extensions: [".mzid", ".mzidentml"],
  description: "Parse mzIdentML, validate peptides, results and IDs.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<MzIdentML xmlns="http://psidev.info/psi/pi/mzIdentML/1.1">',
      "  <SequenceCollection>",
      '    <DBSequence id="DB1" accession="P12345"/>',
      '    <Peptide id="PEP1"><PeptideSequence>PEPTIDE</PeptideSequence></Peptide>',
      '    <PeptideEvidence id="PE1" peptide_ref="PEP1" dBSequence_ref="DB1"/>',
      "  </SequenceCollection>",
      "  <DataCollection><AnalysisData><SpectrumIdentificationList>",
      '    <SpectrumIdentificationResult id="SIR1" spectrumID="scan=1"/>',
      "  </SpectrumIdentificationList></AnalysisData></DataCollection>",
      "</MzIdentML>",
    ].join("\n") + "\n",
}

import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "CDA document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let templateIds = 0
  let sections = 0
  let hasPatientRole = false
  const sectionCodes = new Set<string>()

  for (const tag of tags) {
    if (tag.close) continue
    if (!/ClinicalDocument$/i.test(root)) {
      break
    }
    if (tag.name.endsWith("templateId")) {
      templateIds += 1
      if (!tag.attrs.root) {
        issues.push({ code: "template-without-root", severity: "error", message: "templateId has no root attribute", line: tag.line })
      }
      records.push({ id: `template:${tag.attrs.root ?? templateIds}`, kind: "template", fields: { root: tag.attrs.root ?? "", line: tag.line } })
      continue
    }
    if (tag.name.endsWith("patientRole")) {
      hasPatientRole = true
      records.push({ id: "patientRole", kind: "patient", fields: { line: tag.line } })
      continue
    }
    if (tag.name.endsWith("section")) {
      sections += 1
      const code = tag.attrs.code ?? ""
      if (code) sectionCodes.add(code)
      records.push({ id: `section:${sections}`, kind: "section", fields: { code, line: tag.line } })
      continue
    }
    if (tag.name.endsWith("title")) {
      records.push({ id: `title:${records.length + 1}`, kind: "title", fields: { line: tag.line } })
    }
  }

  if (!/ClinicalDocument$/i.test(root)) {
    issues.push({ code: "bad-root", severity: "error", message: `Root element must be ClinicalDocument, found ${root || "nothing"}` })
  }
  if (templateIds === 0) {
    issues.push({ code: "no-template", severity: "warning", message: "Document declares no templateId" })
  }
  if (!hasPatientRole) {
    issues.push({ code: "no-patient", severity: "warning", message: "Document has no patientRole" })
  }
  if (sections === 0) {
    issues.push({ code: "no-sections", severity: "warning", message: "Document has no section" })
  }

  return {
    format: "HL7 CDA",
    records,
    meta: { root, templateIds, sections, sectionCodes: sectionCodes.size, hasPatientRole },
    issues,
  }
}

const reference = [
  "HL7 Clinical Document Architecture (CDA R2, XML)",
  "",
  "<ClinicalDocument xmlns=\"urn:hl7-org:v3\">",
  "  <templateId root=\"2.16.840.1.113883.10.20.22.1.1\"/>",
  "  <recordTarget><patientRole><id root=\"1.2.3\"/></patientRole></recordTarget>",
  "  <component><structuredBody><component>",
  "    <section><title>Vitals</title><code code=\"8716-3\"/></section>",
  "  </component></structuredBody></component>",
  "</ClinicalDocument>",
  "",
  "The root element is ClinicalDocument.",
  "templateId identifies the document type and needs a root OID.",
  "Sections carry a title and usually a LOINC code.",
].join("\n")

export const format: FormatModule = {
  slug: "hl7-cda",
  displayName: "HL7 CDA",
  extensions: [".xml"],
  description: "Parse HL7 CDA documents, validate root, templates, patient and sections.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<ClinicalDocument xmlns="urn:hl7-org:v3">',
      '  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>',
      '  <recordTarget><patientRole><id root="1.2.3"/></patientRole></recordTarget>',
      "  <component><structuredBody><component>",
      '    <section><title>Vitals</title><code code="8716-3"/></section>',
      "  </component></structuredBody></component>",
      "</ClinicalDocument>",
    ].join("\n") + "\n",
}

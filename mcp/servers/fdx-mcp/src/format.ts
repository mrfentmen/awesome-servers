import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, validateXml } from "./_xml.js"

const TYPES = new Set([
  "Scene Heading",
  "Action",
  "Character",
  "Parenthetical",
  "Dialogue",
  "Transition",
  "Shot",
  "General",
  "Cast List",
  "New Act",
  "End of Act",
  "Page Break",
])

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(source)
  validateXml(source, root, "Final Draft script", issues)
  const records: ParsedRecord[] = []
  let scenes = 0

  for (const match of source.matchAll(/<Paragraph\b([^>]*)>([\s\S]*?)<\/Paragraph>/gi)) {
    const attrs = match[1]
    const body = match[2]
    const type = /Type="([^"]+)"/.exec(attrs)?.[1] ?? ""
    const text = [...body.matchAll(/<Text\b[^>]*>([\s\S]*?)<\/Text>/gi)]
      .map((part) => part[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ")
    if (!type) issues.push({ code: "no-type", severity: "error", message: "Paragraph has no Type attribute" })
    else if (!TYPES.has(type)) issues.push({ code: "bad-type", severity: "error", message: `Unknown paragraph type: ${type}` })
    if (!text) issues.push({ code: "empty-paragraph", severity: "warning", message: `${type || "Paragraph"} has no Text` })
    if (type === "Scene Heading") scenes += 1
    records.push({
      id: `paragraph:${records.length + 1}`,
      kind: type || "paragraph",
      fields: { text: text.slice(0, 300), line: source.slice(0, match.index).split("\n").length },
    })
  }

  if (root !== "FinalDraft") issues.push({ code: "bad-root", severity: "error", message: `Root must be FinalDraft, found ${root || "nothing"}` })
  if (!/<Content\b/i.test(source)) issues.push({ code: "no-content", severity: "error", message: "FinalDraft has no Content element" })
  if (records.length === 0) issues.push({ code: "no-paragraphs", severity: "error", message: "Script has no Paragraph" })
  if (scenes === 0) issues.push({ code: "no-scenes", severity: "warning", message: "Script has no Scene Heading" })

  return { format: "FDX", records, meta: { paragraphs: records.length, scenes }, issues }
}

const reference = [
  "Final Draft FDX screenplay",
  "",
  '<FinalDraft DocumentType="Script" Template="No" Version="1">',
  "  <Content>",
  '    <Paragraph Type="Scene Heading"><Text>INT. LAB - DAY</Text></Paragraph>',
  '    <Paragraph Type="Action"><Text>A robot types.</Text></Paragraph>',
  '    <Paragraph Type="Character"><Text>ALEX</Text></Paragraph>',
  '    <Paragraph Type="Dialogue"><Text>Almost done.</Text></Paragraph>',
  "  </Content>",
  "</FinalDraft>",
  "",
  "Paragraph Type values include Scene Heading, Action, Character, Dialogue.",
  "Each paragraph holds Text elements.",
].join("\n")

export const format: FormatModule = {
  slug: "fdx",
  displayName: "FDX",
  extensions: [".fdx"],
  description: "Parse Final Draft scripts, validate paragraph types, scenes and text.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<FinalDraft DocumentType="Script" Template="No" Version="1">',
      "  <Content>",
      '    <Paragraph Type="Scene Heading"><Text>INT. LAB - DAY</Text></Paragraph>',
      '    <Paragraph Type="Action"><Text>A robot types quickly.</Text></Paragraph>',
      '    <Paragraph Type="Character"><Text>ALEX</Text></Paragraph>',
      '    <Paragraph Type="Dialogue"><Text>Almost done.</Text></Paragraph>',
      "  </Content>",
      "</FinalDraft>",
    ].join("\n") + "\n",
}

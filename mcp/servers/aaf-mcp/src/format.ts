import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

const INTERESTING = new Set([
  "ContentStorage", "MasterMob", "SourceMob", "CompositionMob", "EssenceDescriptor",
  "Identification", "TaggedValue", "Dictionary", "NetworkLocator", "Timecode", "Track",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "AAF", "AAF", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const mobIds = new Set<string>()
  let mobs = 0

  for (const tag of tags) {
    if (tag.close) continue
    if (tag.name.endsWith("Mob")) {
      mobs += 1
      const mobId = tag.attrs.MobID ?? ""
      if (!mobId) {
        issues.push({ code: "mob-without-id", severity: "error", message: `${tag.name} has no MobID attribute`, line: tag.line })
      } else if (mobIds.has(mobId)) {
        issues.push({ code: "duplicate-mob", severity: "error", message: `MobID ${mobId} is used twice`, line: tag.line })
      }
      mobIds.add(mobId)
    }
    if (!INTERESTING.has(tag.name)) continue
    records.push({
      id: `${tag.name}:${tag.attrs.MobID ?? tag.attrs.Name ?? records.length + 1}`,
      kind: tag.name,
      fields: {
        mobId: tag.attrs.MobID ?? "",
        name: tag.attrs.Name ?? "",
        value: tag.attrs.Value ?? "",
        line: tag.line,
      },
    })
  }

  if (mobs === 0) {
    issues.push({ code: "no-mobs", severity: "warning", message: "Document contains no Mob" })
  }
  if (!tags.some((tag) => tag.name === "ContentStorage")) {
    issues.push({ code: "no-content-storage", severity: "warning", message: "Document has no ContentStorage element" })
  }

  return {
    format: "AAF",
    records,
    meta: {
      mobs,
      taggedValues: records.filter((record) => record.kind === "TaggedValue").length,
      essenceDescriptors: records.filter((record) => record.kind === "EssenceDescriptor").length,
      elements: tags.filter((tag) => !tag.close).length,
    },
    issues,
  }
}

const reference = [
  "AAF-XML (Advanced Authoring Format, XML form)",
  "",
  "<?xml version=\"1.0\"?>",
  "<AAF>",
  "  <ContentStorage>",
  "    <MasterMob MobID=\"060a2b34.01010101.01010f00.13000000\">",
  "      <Identification>",
  "        <TaggedValue Name=\"Title\" Value=\"Demo\"/>",
  "      </Identification>",
  "    </MasterMob>",
  "  </ContentStorage>",
  "</AAF>",
  "",
  "Mob elements (MasterMob, SourceMob, CompositionMob) need a unique MobID.",
  "TaggedValue carries Name and Value pairs.",
  "The binary AAF container is not text; this server reads the AAF-XML form.",
].join("\n")

export const format: FormatModule = {
  slug: "aaf",
  displayName: "AAF",
  extensions: [".aafxml", ".xml"],
  description: "Parse AAF-XML content storage, mobs and tagged values.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<AAF>",
      "  <ContentStorage>",
      '    <MasterMob MobID="060a2b34.01010101.01010f00.13000000">',
      "      <Identification>",
      '        <TaggedValue Name="Title" Value="Demo"/>',
      "      </Identification>",
      "    </MasterMob>",
      "  </ContentStorage>",
      "</AAF>",
    ].join("\n") + "\n",
}

import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const ROOTS = new Set(["CompositionPlaylist", "PackingList", "AssetMap"])
const ASSET_TAGS = new Set(["MainPicture", "MainSound", "MainSubtitle", "MainCaption", "AuxData"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "DCP XML", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let reels = 0
  let assets = 0
  let assetLists = 0
  const idMatch = /<\s*(?:[A-Za-z_][\w.-]*:)?Id\b[^>]*>([^<]*)<\s*\/\s*(?:[A-Za-z_][\w.-]*:)?Id\s*>/i.exec(text)
  const id = (idMatch?.[1] ?? "").trim()
  const dateMatch = /<\s*(?:[A-Za-z_][\w.-]*:)?IssueDate\b[^>]*>([^<]*)<\s*\/\s*(?:[A-Za-z_][\w.-]*:)?IssueDate\s*>/i.exec(text)
  const issueDate = (dateMatch?.[1] ?? "").trim()
  if (!id) {
    issues.push({ code: "no-id", severity: "error", message: "Document has no Id" })
  } else if (!/^urn:uuid:[0-9a-f-]{36}$/i.test(id)) {
    issues.push({ code: "bad-id", severity: "error", message: `Id must be a urn:uuid value: ${id}` })
  } else {
    records.push({ id: "dcp", kind: "id", fields: { id } })
  }
  if (issueDate && !/^\d{4}-\d{2}-\d{2}T/.test(issueDate)) {
    issues.push({ code: "bad-date", severity: "warning", message: `IssueDate should be ISO 8601: ${issueDate}` })
  }

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "Reel") {
      reels += 1
      records.push({ id: `reel:${reels}`, kind: "reel", fields: { index: reels, line: tag.line } })
      continue
    }
    if (name === "AssetList") {
      assetLists += 1
      continue
    }
    if (ASSET_TAGS.has(name)) {
      assets += 1
      records.push({ id: `asset:${assets}`, kind: name, fields: { line: tag.line } })
    }
  }

  for (const tag of tags) {
    if (tag.close) continue
    const xmlId = tag.attrs["xml:id"] ?? ""
    if (xmlId && ids.has(xmlId)) {
      issues.push({ code: "duplicate-id", severity: "error", message: `xml:id ${xmlId} appears twice`, line: tag.line })
    }
    ids.add(xmlId)
  }

  const rootName = local(root)
  if (!ROOTS.has(rootName)) {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be CompositionPlaylist, PackingList or AssetMap, found ${rootName || "nothing"}` })
  }
  if (rootName === "CompositionPlaylist" && reels === 0) {
    issues.push({ code: "no-reels", severity: "error", message: "CompositionPlaylist has no Reel" })
  }
  if (rootName !== "CompositionPlaylist" && assets === 0) {
    issues.push({ code: "no-assets", severity: "error", message: `${rootName || "Document"} has no asset` })
  }
  if (assetLists === 0) issues.push({ code: "no-asset-list", severity: "warning", message: "Document has no AssetList" })

  return {
    format: "DCP",
    records,
    meta: { kind: rootName, reels, assets, assetLists, issueDate },
    issues,
  }
}

const reference = [
  "Digital Cinema Package XML (CPL, PKL, ASSETMAP)",
  "",
  '<CompositionPlaylist xmlns="http://www.smpte-ra.org/schemas/429-7/2006/CPL">',
  "  <Id>urn:uuid:11111111-1111-1111-1111-111111111111</Id>",
  "  <AnnotationText>Demo</AnnotationText>",
  "  <IssueDate>2026-11-13T10:00:00Z</IssueDate>",
  "  <ReelList>",
  "    <Reel>",
  "      <AssetList>",
  "        <MainPicture><Id>urn:uuid:22222222-2222-2222-2222-222222222222</Id></MainPicture>",
  "      </AssetList>",
  "    </Reel>",
  "  </ReelList>",
  "</CompositionPlaylist>",
  "",
  "Root is CompositionPlaylist, PackingList or AssetMap.",
  "Id is a urn:uuid value.",
  "A CPL needs at least one Reel and each reel has assets.",
].join("\n")

export const format: FormatModule = {
  slug: "dcp",
  displayName: "DCP",
  extensions: [".xml", ".cpl", ".pkl"],
  description: "Parse DCP XML (CPL, PKL, ASSETMAP), validate IDs, reels and assets.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<CompositionPlaylist xmlns="http://www.smpte-ra.org/schemas/429-7/2006/CPL">',
      "  <Id>urn:uuid:11111111-1111-1111-1111-111111111111</Id>",
      "  <AnnotationText>Demo</AnnotationText>",
      "  <IssueDate>2026-11-13T10:00:00Z</IssueDate>",
      "  <ReelList>",
      "    <Reel>",
      "      <AssetList>",
      "        <MainPicture><Id>urn:uuid:22222222-2222-2222-2222-222222222222</Id></MainPicture>",
      "        <MainSound><Id>urn:uuid:33333333-3333-3333-3333-333333333333</Id></MainSound>",
      "      </AssetList>",
      "    </Reel>",
      "  </ReelList>",
      "</CompositionPlaylist>",
    ].join("\n") + "\n",
}

import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, validateXml } from "./_xml.js"

const textOf = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block)
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : ""
}

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(source)
  validateXml(source, root, "ONIX message", issues)
  const records: ParsedRecord[] = []
  const release = /<ONIXMessage\b[^>]*release="([^"]+)"/i.exec(source)?.[1] ?? ""
  const blocks = [...source.matchAll(/<Product\b[^>]*>([\s\S]*?)<\/Product>/gi)]

  blocks.forEach((match, index) => {
    const block = match[1]
    const ref = textOf(block, "RecordReference")
    const notification = textOf(block, "NotificationType")
    const title = textOf(block, "TitleText")
    const idValue = textOf(block, "IDValue")
    const publisher = textOf(block, "PublisherName")
    if (!ref) issues.push({ code: "no-record-reference", severity: "error", message: `Product ${index + 1} has no RecordReference` })
    if (!notification) issues.push({ code: "no-notification-type", severity: "error", message: `Product ${index + 1} has no NotificationType` })
    else if (!/^0[1-8]$/.test(notification)) issues.push({ code: "bad-notification-type", severity: "error", message: `NotificationType must be 01-08: ${notification}` })
    if (!idValue) issues.push({ code: "no-product-id", severity: "warning", message: `Product ${index + 1} has no IDValue` })
    if (!title) issues.push({ code: "no-title", severity: "error", message: `Product ${index + 1} has no TitleText` })
    records.push({ id: ref || `product:${index + 1}`, kind: "product", fields: { notification, title, isbn: idValue, publisher } })
  })

  if (root !== "ONIXMessage") issues.push({ code: "bad-root", severity: "error", message: `Root must be ONIXMessage, found ${root || "nothing"}` })
  if (release && !/^3\./.test(release)) issues.push({ code: "bad-release", severity: "error", message: `ONIX 3.x expected, found ${release}` })
  if (!release) issues.push({ code: "no-release", severity: "warning", message: "ONIXMessage has no release attribute" })
  if (blocks.length === 0) issues.push({ code: "no-products", severity: "error", message: "Message has no Product" })

  return { format: "ONIX", records, meta: { release: release || "unknown", products: blocks.length }, issues }
}

const reference = [
  "ONIX 3.0 book metadata",
  "",
  '<ONIXMessage release="3.0">',
  "  <Header><Sender><SenderName>Demo</SenderName></Sender></Header>",
  "  <Product>",
  "    <RecordReference>demo-1</RecordReference>",
  "    <NotificationType>03</NotificationType>",
  '    <ProductIdentifier><ProductIDType>15</ProductIDType><IDValue>9780000000001</IDValue></ProductIdentifier>',
  "    <DescriptiveDetail><TitleDetail><TitleElement><TitleText>Demo Book</TitleText></TitleElement></TitleDetail></DescriptiveDetail>",
  '    <PublishingDetail><Publisher><PublisherName>Demo Press</PublisherName></Publisher></PublishingDetail>',
  "  </Product>",
  "</ONIXMessage>",
  "",
  "Each Product needs RecordReference and NotificationType (01-08).",
  "TitleText lives inside DescriptiveDetail.",
].join("\n")

export const format: FormatModule = {
  slug: "onix",
  displayName: "ONIX",
  extensions: [".xml"],
  description: "Parse ONIX 3.0 book metadata, validate products, titles and identifiers.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<ONIXMessage release="3.0">',
      "  <Header><Sender><SenderName>Demo</SenderName></Sender></Header>",
      "  <Product>",
      "    <RecordReference>demo-1</RecordReference>",
      "    <NotificationType>03</NotificationType>",
      '    <ProductIdentifier><ProductIDType>15</ProductIDType><IDValue>9780000000001</IDValue></ProductIdentifier>',
      "    <DescriptiveDetail><TitleDetail><TitleElement><TitleText>Demo Book</TitleText></TitleElement></TitleDetail></DescriptiveDetail>",
      '    <PublishingDetail><Publisher><PublisherName>Demo Press</PublisherName></Publisher></PublishingDetail>',
      "  </Product>",
      "</ONIXMessage>",
    ].join("\n") + "\n",
}

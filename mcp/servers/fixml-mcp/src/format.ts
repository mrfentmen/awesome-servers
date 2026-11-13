import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const MESSAGES = new Set([
  "Order",
  "ExecutionReport",
  "NewOrderSingle",
  "OrderCancelRequest",
  "OrderCancelReplaceRequest",
  "AllocationInstruction",
  "TradeCaptureReport",
  "SecurityDefinition",
  "PositionReport",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "FIXML message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let messages = 0
  let msgType = ""

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "MsgType") {
      msgType = tag.attrs.value ?? ""
      continue
    }
    if (!MESSAGES.has(name)) continue
    messages += 1
    const id = tag.attrs.ID ?? tag.attrs.id ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `Message ID ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `message:${id || messages}`, kind: name, fields: { id, line: tag.line } })
  }

  if (local(root) !== "FIXML") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be FIXML, found ${root || "nothing"}` })
  }
  if (messages === 0) issues.push({ code: "no-messages", severity: "error", message: "File has no FIXML message element" })

  return {
    format: "FIXML",
    records,
    meta: { messages, msgType, ids: ids.size },
    issues,
  }
}

const reference = [
  "FIXML (FIX in XML)",
  "",
  '<FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">',
  "  <Header><MsgType>D</MsgType></Header>",
  '  <Order ID="O1" Side="1" Qty="100" OrdType="2"/>',
  "</FIXML>",
  "",
  "Root is FIXML.",
  "The body holds message elements such as Order or ExecutionReport.",
  "Message IDs must be unique.",
].join("\n")

export const format: FormatModule = {
  slug: "fixml",
  displayName: "FIXML",
  extensions: [".xml", ".fixml"],
  description: "Parse FIXML messages, validate root, message types and IDs.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">',
      "  <Header><MsgType>D</MsgType></Header>",
      '  <Order ID="O1" Side="1" Qty="100" OrdType="2"/>',
      '  <ExecutionReport ID="E1" OrdID="O1" ExecType="0"/>',
      "</FIXML>",
    ].join("\n") + "\n",
}

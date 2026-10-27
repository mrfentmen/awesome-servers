import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyzeText, compareLookalikes, skeleton } from "./security.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })

export function createServer() {
  const server = new McpServer({ name: "unicode-security-mcp", version: "1.0.0" })
  server.tool("analyze_text", "Analyze text locally for Unicode confusables, mixed scripts, invisible controls, and a heuristic risk score. Input is never sent anywhere.", { text: z.string().max(10000) }, async ({ text: value }) => text(JSON.stringify(analyzeText(value), null, 2)))
  server.tool("compare_identifiers", "Compare two identifiers using a Unicode-aware confusable skeleton. This is a warning aid, not a complete security proof.", { left: z.string().min(1).max(500), right: z.string().min(1).max(500) }, async ({ left, right }) => text(JSON.stringify(compareLookalikes(left, right), null, 2)))
  server.tool("get_skeleton", "Return a local normalized confusable skeleton for one identifier.", { value: z.string().max(500) }, async ({ value }) => text(skeleton(value)))
  return server
}

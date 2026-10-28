import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareSnapshots, format } from "./diff.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() { const server = new McpServer({ name: "contract-diff-mcp", version: "1.0.0" }); server.tool("compare_contract_snapshots", "Compare two local JSON contract snapshots using a coarse structural fingerprint; schema names, paths, values, and versions are never returned.", { before: z.string().min(1).max(1000), after: z.string().min(1).max(1000) }, async ({ before, after }) => { try { return text(format(await compareSnapshots(before, after))) } catch (error) { return errorText(error) } }); return server }

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { find, format, get, SpdxError } from "./api.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
export function createServer() { const server = new McpServer({ name: "spdx-mcp", version: "1.0.0" }); server.tool("search_licenses", "Search SPDX license identifiers and names.", { query: z.string().min(1) }, async ({ query }) => { try { return text(format(await find(query))) } catch (e) { return text(`Error: ${e instanceof Error ? e.message : String(e)}`) } }); server.tool("get_license", "Get SPDX metadata for an exact license identifier such as MIT, Apache-2.0, or GPL-3.0-only.", { id: z.string().min(1) }, async ({ id }) => { try { const x = await get(id); return text(x ? format([x]) : `No SPDX license named ${id}.`) } catch (e) { return text(`Error: ${e instanceof Error ? e.message : String(e)}`) } }); return server }
export { SpdxError }

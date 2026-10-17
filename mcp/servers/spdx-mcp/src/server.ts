import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { find, format, get, SpdxError } from "./api.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer() { const server = new McpServer({ name: "spdx-mcp", version: "1.0.0" }); server.registerTool(
    "search_licenses",
    {
      title: "Search licenses",
      description: "Search SPDX license identifiers and names.",
      inputSchema: z.object( { query: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ query }) => { try { return text(format(await find(query))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "get_license",
    {
      title: "Get license",
      description: "Get SPDX metadata for an exact license identifier such as MIT, Apache-2.0, or GPL-3.0-only.",
      inputSchema: z.object( { id: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ id }) => { try { const x = await get(id); return text(x ? format([x]) : `No SPDX license named ${id}.`) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "license_exceptions",
    {
      title: "License exceptions",
      description: "Search the SPDX license exception list: named exceptions to license restrictions, with the example text each one covers.",
      inputSchema: z.object( { query: z.string().min(1).describe("Search term, e.g. classpath or linking exception.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement exceptions locally (paywall removed)
    try { return textError("Not yet implemented: exceptions") } catch (e) { return textError(String(e)) }
  }
  ); return server }
export { SpdxError }

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lei, search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gleif-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search legal entities.",
      inputSchema: z.object( { query: z.string().describe("Entity name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "lei",
    {
      title: "Lei",
      description: "Get a record by LEI.",
      inputSchema: z.object( { id: z.string().describe("LEI code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lei(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "lei_identifiers",
    {
      title: "Lei identifiers",
      description: "Cross references and registration history for one LEI: national registration number, LOU, status and validity dates, direct and ultimate parent, and the BIC, MIC, GEM, QCC and OCID identifiers GLEIF holds.",
      inputSchema: z.object({ id: z.string().describe("20 character LEI code, e.g. '529900PZALZWTFHKJ345'."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement identifiers locally (paywall removed)
    try { return textError("Not yet implemented: identifiers") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "entities_by_country",
    {
      title: "Entities by country",
      description: "List legal entities whose LEI is registered in a given ISO country, with the total GLEIF holds for that country.",
      inputSchema: z.object({ country: z.string().describe("Two letter ISO country code, e.g. 'CH' or 'DE'."), limit: z.number().describe("Max entities, 1-100, default 15.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement country locally (paywall removed)
    try { return textError("Not yet implemented: country") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

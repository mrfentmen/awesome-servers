import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { asnSearch, domainSearch, hashSearch, ipSearch, resultLookup } from "./api.js"
import { search } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "urlscan-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search recent scans.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "result_lookup",
    {
      title: "Result lookup",
      description: "Full report for one scan UUID. Set URLSCAN_API_KEY for private scans.",
      inputSchema: z.object( { uuid: z.string().describe("Scan UUID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await resultLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "domain_search",
    {
      title: "Domain search",
      description: "Scans for one domain.",
      inputSchema: z.object( { value: z.string().describe("Domain like example.com."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await domainSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "ip_search",
    {
      title: "IP search",
      description: "Scans contacting one IP.",
      inputSchema: z.object( { value: z.string().describe("IP address."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ipSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "asn_search",
    {
      title: "ASN search",
      description: "Scans on one ASN.",
      inputSchema: z.object( { value: z.string().describe("ASN like AS15169."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await asnSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "hash_search",
    {
      title: "Hash search",
      description: "Scans serving one file hash.",
      inputSchema: z.object( { value: z.string().describe("SHA256 hash."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hashSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}

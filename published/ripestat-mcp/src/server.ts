import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { network_info, prefix_overview, as_overview, announced_prefixes, asn_neighbours, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "ripestat-mcp", version: "1.0.0" })

  server.tool(
    "network_info",
    "Which ASN announces an IP or prefix, and the covering prefix",
    {
      resource: z.string().min(3).describe("IP address or prefix, e.g. 8.8.8.8 or 1.1.1.0/24")
    },
    async (a) => {
      try {
        return text(await network_info(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "prefix_overview",
    "Who announces a prefix, with holder names",
    {
      resource: z.string().min(3).describe("Prefix or IP, e.g. 8.8.8.0/24"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum ASNs to list")
    },
    async (a) => {
      try {
        return text(await prefix_overview(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "as_overview",
    "Summary of an autonomous system: holder and announcement status",
    {
      asn: z.string().min(1).describe("ASN as 15169 or AS15169")
    },
    async (a) => {
      try {
        return text(await as_overview(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "announced_prefixes",
    "Prefixes an ASN announces",
    {
      asn: z.string().min(1).describe("ASN as 15169 or AS15169"),
      limit: z.number().int().min(1).max(100).default(20).describe("Maximum prefixes to list")
    },
    async (a) => {
      try {
        return text(await announced_prefixes(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "asn_neighbours",
    "ASNs that peer with or transit an ASN",
    {
      asn: z.string().min(1).describe("ASN as 15169 or AS15169"),
      limit: z.number().int().min(1).max(100).default(25).describe("Maximum neighbours to list")
    },
    async (a) => {
      try {
        return text(await asn_neighbours(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

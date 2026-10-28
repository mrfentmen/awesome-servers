import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { network_by_asn, network_search, exchange_search, facility_search, network_contacts, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "peeringdb-mcp", version: "1.0.0" })

  server.tool(
    "network_by_asn",
    "PeeringDB record for an ASN",
    {
      asn: z.number().int().min(1).describe("Autonomous system number, e.g. 15169")
    },
    async (a) => {
      try {
        return text(await network_by_asn(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "network_search",
    "Search PeeringDB networks by name",
    {
      name: z.string().min(2).describe("Part of the network name, e.g. Google"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum networks")
    },
    async (a) => {
      try {
        return text(await network_search(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "exchange_search",
    "Search internet exchange points by name",
    {
      name: z.string().min(2).describe("Part of the exchange name, e.g. Equinix"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum exchanges")
    },
    async (a) => {
      try {
        return text(await exchange_search(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "facility_search",
    "Search data-centre facilities by name",
    {
      name: z.string().min(2).describe("Part of the facility name, e.g. Equinix"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum facilities")
    },
    async (a) => {
      try {
        return text(await facility_search(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "network_contacts",
    "Peering contacts listed for an ASN",
    {
      asn: z.number().int().min(1).describe("Autonomous system number, e.g. 15169")
    },
    async (a) => {
      try {
        return text(await network_contacts(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

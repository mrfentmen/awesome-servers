import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listZones,
  listAccounts,
  listDns,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cloudflare-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_zones",
    {
      title: "List zones",
      description: "Cloudflare zones (domains) in the account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listZones());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_accounts",
    {
      title: "List accounts",
      description: "Cloudflare accounts the token can reach.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listAccounts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_dns",
    {
      title: "List DNS",
      description: "DNS records in one zone id, with type and TTL.",
      inputSchema: z.object({
        zone_id: z.string().describe("Zone ID, e.g. 023e105f4ecef8ad9ca31a8372d0c353")
      }),
      annotations: READ_ONLY,
    },
    async ({ zone_id }) => {
      try {
        return text(await listDns(zone_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
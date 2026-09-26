import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProfiles,
  listLists,
  listCampaigns,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "klaviyo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_profiles",
    {
      title: "List profiles",
      description: "Customer profiles with email and location.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProfiles());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_lists",
    {
      title: "List lists",
      description: "Marketing lists with subscriber counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listLists());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_campaigns",
    {
      title: "List campaigns",
      description: "Klaviyo campaigns with status and send time.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCampaigns());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProfiles,
  listLists,
  listCampaigns,
  profileDetails,
  listDetails,
  campaignDetails,
  metrics,
  events,
  flows,
  segments,
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

  server.registerTool(
    "profile_details",
    {
      title: "Profile details",
      description: "Single profile.",
      inputSchema: z.object({
        profile_id: z.string().describe("Profile ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ profile_id }) => {
      try {
        return text(await profileDetails(profile_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_details",
    {
      title: "List details",
      description: "Single list.",
      inputSchema: z.object({
        list_id: z.string().describe("List ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ list_id }) => {
      try {
        return text(await listDetails(list_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "campaign_details",
    {
      title: "Campaign details",
      description: "Single campaign.",
      inputSchema: z.object({
        campaign_id: z.string().describe("Campaign ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ campaign_id }) => {
      try {
        return text(await campaignDetails(campaign_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "metrics",
    {
      title: "Metrics",
      description: "Event metrics.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await metrics());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "events",
    {
      title: "Events",
      description: "Recent events.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await events());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "flows",
    {
      title: "Flows",
      description: "Automation flows.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await flows());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "segments",
    {
      title: "Segments",
      description: "Segments.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await segments());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
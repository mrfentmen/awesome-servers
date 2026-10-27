import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  ping,
  listLists,
  listMembers,
  listCampaigns,
  listDetails,
  memberDetails,
  campaignDetails,
  automations,
  segments,
  campaignReport,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mailchimp-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Check that the Mailchimp API key still works.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await ping());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_lists",
    {
      title: "List audiences",
      description: "Mailchimp audiences, with member counts.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listLists(count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_members",
    {
      title: "List members",
      description: "Members of one audience, with status and email.",
      inputSchema: z.object({
        list_id: z.string().describe("Audience ID."),
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ list_id, count }) => {
      try {
        return text(await listMembers(list_id, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_campaigns",
    {
      title: "List campaigns",
      description: "Sent and scheduled campaigns, newest first.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listCampaigns(count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_details",
    {
      title: "Audience details",
      description: "Single audience.",
      inputSchema: z.object({
        list_id: z.string().describe("Audience ID.")
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
    "member_details",
    {
      title: "Member details",
      description: "Member by email.",
      inputSchema: z.object({
        list_id: z.string().describe("Audience ID."),
        email: z.string().describe("Member email.")
      }),
      annotations: READ_ONLY,
    },
    async ({ list_id, email }) => {
      try {
        return text(await memberDetails(list_id, email));
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
    "automations",
    {
      title: "Automations",
      description: "Customer journeys.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await automations());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "segments",
    {
      title: "Segments",
      description: "Audience segments.",
      inputSchema: z.object({
        list_id: z.string().describe("Audience ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ list_id }) => {
      try {
        return text(await segments(list_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "campaign_report",
    {
      title: "Campaign report",
      description: "Opens/clicks.",
      inputSchema: z.object({
        campaign_id: z.string().describe("Campaign ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ campaign_id }) => {
      try {
        return text(await campaignReport(campaign_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
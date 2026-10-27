import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listCustomers,
  getCustomer,
  listSegments,
  segmentDetails,
  campaigns,
  campaignDetails,
  newsletters,
  activities,
  customerActivities,
  customerMessages,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "customerio-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_customers",
    {
      title: "List customers",
      description: "Tracked customers with email and attributes.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCustomers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_customer",
    {
      title: "Get customer",
      description: "One customer profile by id, with its attributes.",
      inputSchema: z.object({
        identifier: z.string().describe("ID or email.")
      }),
      annotations: READ_ONLY,
    },
    async ({ identifier }) => {
      try {
        return text(await getCustomer(identifier));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_segments",
    {
      title: "List segments",
      description: "Segments with id, name and member counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listSegments());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "segment_details",
    {
      title: "Segment details",
      description: "Single segment.",
      inputSchema: z.object({
        segment_id: z.string().describe("Segment ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ segment_id }) => {
      try {
        return text(await segmentDetails(segment_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "campaigns",
    {
      title: "Campaigns",
      description: "All campaigns.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await campaigns());
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
    "newsletters",
    {
      title: "Newsletters",
      description: "All newsletters.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await newsletters());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "activities",
    {
      title: "Activities",
      description: "Workspace activity.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await activities());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "customer_activities",
    {
      title: "Customer activity",
      description: "Activity for a customer.",
      inputSchema: z.object({
        identifier: z.string().describe("ID or email.")
      }),
      annotations: READ_ONLY,
    },
    async ({ identifier }) => {
      try {
        return text(await customerActivities(identifier));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "customer_messages",
    {
      title: "Customer messages",
      description: "Messages for a customer.",
      inputSchema: z.object({
        identifier: z.string().describe("ID or email.")
      }),
      annotations: READ_ONLY,
    },
    async ({ identifier }) => {
      try {
        return text(await customerMessages(identifier));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
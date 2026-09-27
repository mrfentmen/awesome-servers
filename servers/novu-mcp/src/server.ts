import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listSubscribers,
  getSubscriber,
  listTopics,
  topicDetails,
  notifications,
  environments,
  integrations,
  layouts,
  feeds,
  blueprintGroups,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "novu-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_subscribers",
    {
      title: "Subscribers",
      description: "Notification subscribers, with email and id.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listSubscribers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_subscriber",
    {
      title: "Get subscriber",
      description: "One subscriber by id, with channels and data.",
      inputSchema: z.object({
        subscriber_id: z.string().describe("Subscriber ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ subscriber_id }) => {
      try {
        return text(await getSubscriber(subscriber_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_topics",
    {
      title: "Topics",
      description: "Notification topics with subscriber counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTopics());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "topic_details",
    {
      title: "Topic details",
      description: "Single topic.",
      inputSchema: z.object({
        topic_key: z.string().describe("Topic key.")
      }),
      annotations: READ_ONLY,
    },
    async ({ topic_key }) => {
      try {
        return text(await topicDetails(topic_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "notifications",
    {
      title: "Notifications",
      description: "Templates list.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await notifications(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "environments",
    {
      title: "Environments",
      description: "All environments.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await environments());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "integrations",
    {
      title: "Integrations",
      description: "Providers.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await integrations());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "layouts",
    {
      title: "Layouts",
      description: "Email layouts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await layouts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "feeds",
    {
      title: "Feeds",
      description: "Notification feeds.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await feeds());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "blueprint_groups",
    {
      title: "Blueprint groups",
      description: "Grouped blueprints.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await blueprintGroups());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, publish, poll, health, account, pollSince, sendUrgent, sendScheduled, sendEmail, sendCall, publishTags, ntfyServerCapabilities, topicMessageHistory } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ntfy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "publish",
    {
      title: "Publish",
      description: "Send a REAL notification to a topic.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name, e.g. my-alerts"),
        message: z.string().describe("Message text.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message }) => {
      try {
        return text(await publish(topic, message));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "poll",
    {
      title: "Poll messages",
      description: "Messages cached on a topic, as JSON, since a given time.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name, e.g. my-alerts")
      }),
      annotations: READ_ONLY,
    },
    async ({ topic }) => {
      try {
        return text(await poll(topic));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "health",
    {
      title: "Server health",
      description: "ntfy server status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await health());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "account",
    {
      title: "Account info",
      description: "Tier and limits.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await account());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "poll_since",
    {
      title: "Poll since ID",
      description: "Messages after an ID.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        since_id: z.string().describe("Message ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ topic, since_id }) => {
      try {
        return text(await pollSince(topic, since_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "send_urgent",
    {
      title: "Urgent push",
      description: "Max-priority REAL push.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        message: z.string().describe("Message text.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message }) => {
      try {
        return text(await sendUrgent(topic, message));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "send_scheduled",
    {
      title: "Scheduled push",
      description: "Delayed REAL push.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        message: z.string().describe("Message text."),
        delay: z.string().describe("e.g. 10m, tomorrow, 9am.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message, delay }) => {
      try {
        return text(await sendScheduled(topic, message, delay));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "send_email",
    {
      title: "Push via email",
      description: "REAL email + push.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        message: z.string().describe("Message text."),
        email: z.string().describe("Recipient email.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message, email }) => {
      try {
        return text(await sendEmail(topic, message, email));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "send_call",
    {
      title: "Voice call",
      description: "REAL phone call.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        message: z.string().describe("Spoken text."),
        phone: z.string().describe("E.164 number.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message, phone }) => {
      try {
        return text(await sendCall(topic, message, phone));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "publish_tags",
    {
      title: "Tagged push",
      description: "Push with emoji tags.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        message: z.string().describe("Message text."),
        tags: z.string().describe("Comma tags, e.g. warning,skull.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message, tags }) => {
      try {
        return text(await publishTags(topic, message, tags));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "ntfy_server_capabilities",
    {
      title: "Ntfy server capabilities",
      description: "What an ntfy server will and will not allow, read from its public health and config endpoints: healthy or not, whether login is required before anything, which auth methods exist, which features are on, the attachment and cache limits and the per-visitor rate limits.",
      inputSchema: z.object({ topic: z.string().describe("Unused, kept for a uniform signature.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await ntfyServerCapabilities(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "topic_message_history",
    {
      title: "Topic message history",
      description: "Read back what a public ntfy topic has already published, with no token: how many events and messages in the window, which event types and priorities came through, how many carry attachments or tags, and the newest messages with their titles, bodies and expiry.",
      inputSchema: z.object({ topic: z.string().describe("Topic name, e.g. alerts."), hours: z.number().int().min(1).max(720).default(24).describe("How far back to read (default 24 hours, max 720)."), limit: z.number().int().min(1).max(30).default(10).describe("Events to print (default 10, max 30).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await topicMessageHistory(args)) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}
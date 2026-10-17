import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, sendMessage, listMessages, listApps, alertPayload, retrySchedule } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gotify-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "send_message",
    {
      title: "Send message",
      description: "Push a notification via Gotify.",
      inputSchema: z.object({
        title: z.string().describe("Message title."),
        message: z.string().describe("Message body."),
        priority: z.string().describe("0-10 (default 5).").optional()
      }),
      annotations: MUTATING,
    },
    async ({ title, message, priority }) => {
      try {
        return text(await sendMessage(title, message, priority));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_messages",
    {
      title: "List messages",
      description: "Messages stored on the Gotify server, newest first.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listMessages(limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_apps",
    {
      title: "List applications",
      description: "Registered Gotify applications.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listApps());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "alert_payload",
    {
      title: "Alert payload",
      description: "Build and validate the exact Gotify alert body for a title, message, priority, click URL and extras, and report its size against Android's 4096-byte cap. Sends nothing.",
      inputSchema: z.object({
        title: z.string().describe("Alert title, up to 200 characters."),
        message: z.string().describe("Alert body text."),
        priority: z.enum(["min", "low", "default", "high", "max"]).default("default").describe("Gotify priority name."),
        tags: z.string().describe("Optional comma separated tags to carry in the message.").optional(),
        click: z.string().describe("Optional http or https URL the tap opens.").optional(),
        extras: z.string().describe("Optional extras as a raw JSON object.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await alertPayload(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "retry_schedule",
    {
      title: "Retry schedule",
      description: "The concrete retry ladder for a push pipeline: exponential backoff from a base delay, capped, with reproducible full-jitter waits and the cumulative time a client would spend.",
      inputSchema: z.object({
        base_delay_ms: z.number().int().min(1).max(3600000).default(1000).describe("First backoff window in milliseconds."),
        multiplier: z.number().min(1).max(10).default(2).describe("Growth factor per attempt."),
        cap_ms: z.number().int().min(1).default(300000).describe("Ceiling for any single backoff window."),
        attempts: z.number().int().min(1).max(30).default(6).describe("How many retries to plan."),
        jitter: z.enum(["full", "none"]).default("full").describe("Jitter to spread retries out.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await retrySchedule(args)) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listAssistants, getAssistant, listCalls, getCall, voiceStackStatus, stackMaintenance } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "vapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_assistants",
    {
      title: "List assistants",
      description: "Voice assistants on the account, with id and model.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listAssistants(limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_assistant",
    {
      title: "Get assistant",
      description: "One assistant by id, with its prompt and voice config.",
      inputSchema: z.object({
        assistant_id: z.string().describe("Assistant UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ assistant_id }) => {
      try {
        return text(await getAssistant(assistant_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_calls",
    {
      title: "List calls",
      description: "Call history with duration, cost and outcome.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCalls(limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_call",
    {
      title: "Get call",
      description: "One call by id, with transcript and recording URL.",
      inputSchema: z.object({
        call_id: z.string().describe("Call ID from the VAPI dashboard")
      }),
      annotations: READ_ONLY,
    },
    async ({ call_id }) => {
      try {
        return text(await getCall(call_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "voice_stack_status",
    {
      title: "Voice stack status",
      description:
        "Health of every layer a Vapi agent sits on, read from each provider's own public status page: telephony, transport, speech to text, text to speech and the language model, with the worst layer named and any open incident listed. No VAPI_API_KEY needed.",
      inputSchema: z.object({
        layer: z.string().describe("Restrict to one layer, e.g. telephony, transport, speech to text, language model.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await voiceStackStatus(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "stack_maintenance",
    {
      title: "Stack maintenance",
      description:
        "The forward-looking view of the same stack: what telephony, transport, speech and model providers have scheduled, when each window runs, what has just finished, and which layers are involved. No VAPI_API_KEY needed.",
      inputSchema: z.object({
        window: z.number().describe("Days either side of now to include, 1-180. Defaults to 45.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stackMaintenance(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listVoices,
  getVoice,
  synthesizeSpeech,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cartesia-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_voices",
    {
      title: "List voices",
      description: "Voices available on the account, with language.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listVoices(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_voice",
    {
      title: "Get voice",
      description: "One voice by id, with its embedding and settings.",
      inputSchema: z.object({
        voice_id: z.string().describe("Voice ID from Cartesia, e.g. a0e7d23f")
      }),
      annotations: READ_ONLY,
    },
    async ({ voice_id }) => {
      try {
        return text(await getVoice(voice_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "synthesize_speech",
    {
      title: "Synthesize speech",
      description: "Render text to MP3 with a voice — this spends credits.",
      inputSchema: z.object({
        transcript: z.string().describe("Text to speak."),
        voice_id: z.string().describe("Voice ID from Cartesia, e.g. a0e7d23f"),
        model_id: z.string().describe("Model (default sonic-2).").optional()
      }),
      annotations: MUTATING,
    },
    async ({ transcript, voice_id, model_id }) => {
      try {
        return text(await synthesizeSpeech(transcript, voice_id, model_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
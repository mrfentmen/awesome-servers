import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTranscripts,
  getTranscript,
  getParagraphs,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "assemblyai-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_transcripts",
    {
      title: "List transcripts",
      description: "Recent transcripts.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listTranscripts(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_transcript",
    {
      title: "Get transcript",
      description: "Transcript details and status.",
      inputSchema: z.object({
        transcript_id: z.string().describe("Transcript ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ transcript_id }) => {
      try {
        return text(await getTranscript(transcript_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_paragraphs",
    {
      title: "Get paragraphs",
      description: "Paragraph-grouped transcript text.",
      inputSchema: z.object({
        transcript_id: z.string().describe("Transcript ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ transcript_id }) => {
      try {
        return text(await getParagraphs(transcript_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
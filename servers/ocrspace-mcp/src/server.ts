import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  parseImageUrl,
  parseImagePost,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ocrspace-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "parse_image_url",
    {
      title: "OCR via GET",
      description: "Extract text from an image URL.",
      inputSchema: z.object({
        image_url: z.string().describe("Public image URL."),
        language: z.string().describe("e.g. eng (default eng).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ image_url, language }) => {
      try {
        return text(await parseImageUrl(image_url, language));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "parse_image_post",
    {
      title: "OCR via POST",
      description: "Extract text with overlay option.",
      inputSchema: z.object({
        image_url: z.string().describe("Public image URL."),
        overlay: z.string().describe("true/false (default false).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ image_url, overlay }) => {
      try {
        return text(await parseImagePost(image_url, overlay));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
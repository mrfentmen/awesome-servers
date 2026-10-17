import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { inspectImage } from "./api.js"
import { resizeImage, probeUrl, convertUrlImage } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "image-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "resize_image",
    {
      title: "Resize image",
      description: "Resize a local image to a new width.",
      inputSchema: z.object( { path: z.string().describe("Path to the source image."), width: z.number().describe("New width in pixels."), filename: z.string().describe("Output file name.").optional() }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await resizeImage(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "inspect_image",
    {
      title: "Inspect image",
      description: "Return format, width, height, and file size of an image.",
      inputSchema: z.object( { path: z.string().describe("Path to the image.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await inspectImage(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "probe_url",
    {
      title: "Probe url",
      description: "Download an image from a url and report its real format, dimensions, channels, alpha and density, which is how you find out what a server is actually serving.",
      inputSchema: z.object( { url: z.string().describe("Image url."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await probeUrl(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "convert_url_image",
    {
      title: "Convert url image",
      description: "Download an image from a url, optionally resize it, convert it to jpeg, png, webp, avif, tiff or gif and write the result to a temp file.",
      inputSchema: z.object( { url: z.string().describe("Image url."), format: z.string().describe("jpeg, png, webp, avif, tiff or gif.").optional(), width: z.number().describe("Resize width in pixels.").optional(), filename: z.string().describe("Output file name.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convertUrlImage(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

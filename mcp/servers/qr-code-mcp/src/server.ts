import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { generateQr, qr_analyse } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "qr-code-mcp", version: "1.0.0" })
  server.registerTool(
    "generate_qr",
    {
      title: "Generate qr",
      description: "Generate a QR code PNG for any text or URL.",
      inputSchema: z.object( { text: z.string().describe("Text or URL to encode."), size: z.number().describe("Image size in pixels.").optional(), filename: z.string().describe("Output file name.").optional() }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await generateQr(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "qr_capacity",
    {
      title: "QR capacity check",
      description: "Check whether a payload can be encoded as a QR code before generating it: its size in bytes, which encoding mode the encoder will pick and why, the byte ceiling at error correction L, M, Q and H with the percentage of the ceiling used, the version and module grid each level would produce, and how much the payload would have to shrink to reach a higher level. generate_qr just encodes and either succeeds or throws a bare length error, so an over-long URL gives no explanation.",
      inputSchema: z.object({
        text: z.string().describe("The text or URL to check."),
        level: z.string().optional().describe("Error correction level to check against: L, M, Q or H. Default M."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // args.text is read rather than destructured: a parameter named text
      // shadows the module-level text helper used on the line below.
      // TODO: implement capacity locally (paywall removed)
      try { return textError("Not yet implemented: capacity") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "qr_analyse",
    {
      title: "QR payload analysis",
      description: "Say what a scanner will do with a payload: whether it is read as a web link, an email, a telephone number, a saved wifi network, a location, a contact card or plain text, what the scanner does with each of those, which QR encoding mode applies, and what a bare string costs in lost automation. Two payloads encode identically and behave completely differently, and the encoded image does not show which one you have.",
      inputSchema: z.object({
        text: z.string().describe("The text or URL to analyse."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await qr_analyse({ text: args.text })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "qr_size_report",
    {
      title: "QR size report",
      description: "Report the QR version and module grid a payload produces at a given error correction level, the module size in pixels at each of 128, 256, 512, 1024 and 2048 pixels wide, and whether each of those is large enough for a phone camera at the usual three pixels per module, plus the smallest and largest grid the payload gives across all four levels. Nothing is written to disk. generate_qr reports the PNG byte count but not the grid it had to hit.",
      inputSchema: z.object({
        text: z.string().describe("The text or URL to measure."),
        level: z.string().optional().describe("Error correction level: L, M, Q or H. Default M."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement report locally (paywall removed)
      try { return textError("Not yet implemented: report") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

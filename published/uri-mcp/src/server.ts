import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { base64Decode, base64Encode, decodeUrl, encodeUrl, parseUrl, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "uri-mcp", version: "1.0.1" })

  server.tool(
    "parse_url",
    "Break a URL into parts and list its query parameters decoded.",
    {
      url: z.string().min(3).describe("Absolute URL, e.g. https://example.com/a?x=1&y=two%20words#top")
    },
    async (a) => {
      try {
        return text(await parseUrl(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "encode_url",
    "Percent-encode text, either as a component or as a whole URL.",
    {
      text: z.string().describe("Text to encode"),
      component: z.boolean().default(true).describe("True encodes all reserved characters (for one query value); false keeps :/?#[]@ and similar")
    },
    async (a) => {
      try {
        return text(await encodeUrl(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "decode_url",
    "Percent-decode text and report any malformed escapes.",
    {
      text: z.string().describe("Percent-encoded text, e.g. two%20words")
    },
    async (a) => {
      try {
        return text(await decodeUrl(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "base64_encode",
    "Encode text to base64 or base64url.",
    {
      text: z.string().describe("Text to encode"),
      urlSafe: z.boolean().default(false).describe("Use the URL-safe alphabet (- and _ instead of + and /)")
    },
    async (a) => {
      try {
        return text(await base64Encode(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "base64_decode",
    "Decode base64 or base64url back to text.",
    {
      text: z.string().min(1).describe("Base64 text"),
      urlSafe: z.boolean().default(false).describe("Input uses the URL-safe alphabet")
    },
    async (a) => {
      try {
        return text(await base64Decode(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

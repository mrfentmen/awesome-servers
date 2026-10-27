import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { hashAll, hashText, hmacText, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "hash-mcp", version: "1.0.1" })

  server.tool(
    "hash_text",
    "One digest of a text in the chosen algorithm.",
    {
      text: z.string().describe("Text to hash"),
      algorithm: z.enum(["md5", "sha1", "sha256", "sha384", "sha512"]).default("sha256").describe("Hash algorithm")
    },
    async (a) => {
      try {
        return text(await hashText(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "hash_all",
    "Every supported digest of a text, in hex.",
    {
      text: z.string().describe("Text to hash")
    },
    async (a) => {
      try {
        return text(await hashAll(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "hmac_text",
    "HMAC of a text with a key, for webhook and API signature checks.",
    {
      text: z.string().describe("Message to authenticate"),
      key: z.string().min(1).describe("Shared secret key"),
      algorithm: z.enum(["sha1", "sha256", "sha384", "sha512"]).default("sha256").describe("HMAC algorithm")
    },
    async (a) => {
      try {
        return text(await hmacText(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

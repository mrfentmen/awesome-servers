import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { hash, hmac, secureRandom } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "crypto-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "hash",
    {
      title: "Hash",
      description: "Hash text with an algorithm.",
      inputSchema: z.object( { text: z.string().describe("Input text."), algorithm: z.string().describe("md5, sha1, sha256, or sha512.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hash(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "hmac",
    {
      title: "Hmac",
      description: "Compute an HMAC for text.",
      inputSchema: z.object( { text: z.string().describe("Input text."), key: z.string().describe("Secret key.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hmac(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "base64_codec",
    {
      title: "Base64 codec",
      description: "Encode text as base64 or base64url, or decode either back to text.",
      inputSchema: z.object( { text: z.string().describe("Text to encode or base64 to decode."), mode: z.string().describe("encode or decode.").optional(), variant: z.string().describe("base64 or base64url.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement codec locally (paywall removed)
    try { return textError("Not yet implemented: codec") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "secure_random",
    {
      title: "Secure random",
      description: "Generate cryptographically secure random bytes as hex, base64 or base64url.",
      inputSchema: z.object( { bytes: z.number().describe("How many bytes, 1 to 4096.").optional(), encoding: z.string().describe("hex, base64 or base64url.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await secureRandom(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "password_hash",
    {
      title: "Password hash",
      description: "Derive a salted scrypt hash of a password, or check a candidate against a stored one in constant time.",
      inputSchema: z.object( { password: z.string().describe("The password or candidate."), salt: z.string().describe("Salt as hex. Omit to generate one.").optional(), verify: z.string().describe("Stored scrypt$salt$hash value to check against.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement hash locally (paywall removed)
    try { return textError("Not yet implemented: hash") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

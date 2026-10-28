import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { generateSecret, generateTotp, verifyTotp, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "totp-mcp", version: "1.0.0" })

  server.tool(
    "generate_totp",
    "Current TOTP code for a base32 secret, with seconds left and the next code. Pass at to evaluate a specific moment.",
    {
      secret: z.string().describe('Base32 secret (A-Z, 2-7)'), digits: z.number().int().min(6).max(10).optional().describe('Code length, default 6'), period: z.number().int().min(10).max(300).optional().describe('Step in seconds, default 30'), algorithm: z.string().optional().describe('sha1, sha256 or sha512 (default sha1)'), at: z.string().optional().describe('ISO 8601 time to evaluate instead of now')
    },
    async (a) => {
      try {
        return text(await generateTotp(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "verify_totp",
    "Check a TOTP code against a secret within a drift window, using a constant-time comparison.",
    {
      secret: z.string().describe('Base32 secret'), code: z.string().describe('Code to verify'), digits: z.number().int().min(6).max(10).optional().describe('Code length, default 6'), period: z.number().int().min(10).max(300).optional().describe('Step in seconds, default 30'), algorithm: z.string().optional().describe('sha1, sha256 or sha512'), window: z.number().int().min(0).max(10).optional().describe('Steps of drift to accept, default 1')
    },
    async (a) => {
      try {
        return text(await verifyTotp(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "generate_secret",
    "Create a fresh random base32 secret, optionally with an otpauth:// URI for authenticator apps.",
    {
      length: z.number().int().min(10).max(64).optional().describe('Secret size in bytes, default 20'), account: z.string().optional().describe('Account name, e.g. alice@example.com (adds the otpauth URI)'), issuer: z.string().optional().describe('Issuer name shown in the app'), digits: z.number().int().min(6).max(10).optional().describe('Code digits for the URI, default 6'), period: z.number().int().min(10).max(300).optional().describe('Step seconds for the URI, default 30')
    },
    async (a) => {
      try {
        return text(await generateSecret(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}

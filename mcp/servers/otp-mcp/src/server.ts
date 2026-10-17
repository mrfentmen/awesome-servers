import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { generateHotp, generateTotp, provisioningUri } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "otp-mcp", version: "1.0.0" })
  server.registerTool(
    "generate_totp",
    {
      title: "Generate totp",
      description: "Generate a TOTP code for a secret.",
      inputSchema: z.object( { secret: z.string().describe("Base32 secret.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generateTotp(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "generate_hotp",
    {
      title: "Generate hotp",
      description: "Generate an HOTP code for a counter.",
      inputSchema: z.object( { secret: z.string().describe("Base32 secret."), counter: z.number().describe("Counter value.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generateHotp(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "verify_totp",
    {
      title: "Verify totp",
      description: "Check a submitted TOTP code against a base32 secret, searching a bounded number of 30 second windows either side of now.",
      inputSchema: z.object( { secret: z.string().describe("Base32 secret."), code: z.string().describe("The code as shown, digits only."), drift: z.number().describe("How many 30 second windows either side to accept, 0-5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement totp locally (paywall removed)
    try { return textError("Not yet implemented: totp") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "provisioning_uri",
    {
      title: "Provisioning uri",
      description: "Build the standard otpauth:// provisioning URI for a TOTP or HOTP entry, plus the canonical base32 form and the key length it encodes. Local only.",
      inputSchema: z.object( { secret: z.string().describe("Base32 secret."), label: z.string().describe("Account label, e.g. example.com:alice."), issuer: z.string().describe("Issuer name.").optional(), type: z.string().describe("totp or hotp.").optional(), digits: z.number().describe("Code length, 6-10.").optional(), period: z.number().describe("TOTP period in seconds, 15-300.").optional(), counter: z.number().describe("Starting counter for hotp.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await provisioningUri(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "secret_entropy",
    {
      title: "Secret entropy",
      description: "Measure a base32 secret locally: key length, Shannon entropy per byte, distinct byte values and how long the search space would take to exhaust at a given guess rate. Local only.",
      inputSchema: z.object( { secret: z.string().describe("Base32 secret."), guessesPerSecond: z.number().describe("Attacker guesses per second for the time estimate.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement entropy locally (paywall removed)
    try { return textError("Not yet implemented: entropy") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

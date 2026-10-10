import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { decode, verify } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jwt-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "decode",
    {
      title: "Decode",
      description: "Decode a JWT header and payload.",
      inputSchema: z.object( { token: z.string().describe("The JWT string.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await decode(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "verify",
    {
      title: "Verify",
      description: "Verify a JWT signature with a secret.",
      inputSchema: z.object( { token: z.string().describe("The JWT string."), secret: z.string().describe("HMAC secret.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await verify(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "list_signing_keys",
    {
      title: "List signing keys from a JWKS",
      description: "Fetch a JSON Web Key Set and list each signing key: kid, key type, algorithm, use and whether an x509 chain is attached.",
      inputSchema: z.object({
        jwks_uri: z.string().optional().describe("https URL of the JWKS. Defaults to Google's public certs endpoint."),
        limit: z.number().int().min(1).max(50).optional().describe("How many keys to list (1-50, default 10)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_signing_keys ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jwt_tools_list_signing_keys", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "describe_issuer",
    {
      title: "Describe an OpenID Connect issuer",
      description: "Read an issuer's .well-known/openid-configuration and report its endpoints, signing algorithms, grant types, scopes, supported claims and PKCE methods.",
      inputSchema: z.object({
        issuer: z.string().optional().describe("Issuer base URL, for example https://accounts.google.com or https://login.microsoftonline.com/common/v2.0. Defaults to Google."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: describe_issuer ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jwt_tools_describe_issuer", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}

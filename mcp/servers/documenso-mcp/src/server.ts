import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { DocumensoError, formatDocument, getDocument, listDocuments, instanceHealth } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "documenso-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_documents",
    {
      title: "List documents",
      description: "Signing documents with titles and statuses.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listDocuments(limit)
        if (rows.length === 0) return text("No documents.")
        return text(rows.map((d, i) => formatDocument(d, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description: "One document with recipients and signing states.",
      inputSchema: z.object({
        id: z.string().describe("Document id (use list_documents)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatDocument(await getDocument(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "instance_health",
    {
      title: "Check instance health",
      description: "Read the public /api/health of the Documenso instance DOCUMENSO_URL points at, including its database and certificate checks. Needs no API key, so it works on a self-hosted deployment before you have one.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await instanceHealth()) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "signing_flow_plan",
    {
      title: "Plan a signing flow",
      description: "Validate a recipient list and its fields before you create a document, and produce the exact create-many request body: duplicate emails, gaps in the signing order, approvers placed after the signers they release, fields assigned to a CC or VIEWER who cannot act, and signers with no signature field.",
      inputSchema: z.object({
        recipients: z.array(z.object({
          email: z.string().describe("Recipient email"),
          name: z.string().optional().describe("Display name on the document"),
          role: z.enum(["signer", "approver", "viewer", "cc", "assistant"]).optional().describe("Role, default signer"),
          order: z.number().int().optional().describe("Signing round, starting at 1"),
        })).describe("Everyone on the document"),
        fields: z.array(z.object({
          label: z.string().describe("What the field is, e.g. 'Signature' or 'Start date'"),
          type: z.string().describe("SIGNATURE, INITIALS, NAME, EMAIL, DATE, TEXT, NUMBER, RADIO, CHECKBOX or DROPDOWN"),
          for: z.string().optional().describe("Email of the recipient who fills it in"),
        })).optional().describe("Fields placed on the document"),
        envelope_id: z.string().optional().describe("Existing envelope id, if you already created one"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: signing_flow_plan ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_documenso_signing_flow_plan", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DocumensoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

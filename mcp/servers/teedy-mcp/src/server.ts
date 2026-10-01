import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  login,
  listDocuments,
  getDocument,
  listDocumentFiles,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "teedy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "login",
    {
      title: "Login",
      description: "Log in with username/password; returns the auth_token to set as TEEDY_AUTH_TOKEN.",
      inputSchema: z.object({
        username: z.string().describe("Teedy username."),
        password: z.string().describe("Teedy password.")
      }),
      annotations: MUTATING,
    },
    async ({ username, password }) => {
      try {
        return text(await login(username, password));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_documents",
    {
      title: "List documents",
      description: "Documents in the Teedy inbox/library (requires TEEDY_AUTH_TOKEN).",
      inputSchema: z.object({
        search: z.string().describe("Full-text search query.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ search }) => {
      try {
        return text(await listDocuments(search));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description: "Teedy document metadata by ID (requires TEEDY_AUTH_TOKEN).",
      inputSchema: z.object({
        doc_id: z.string().describe("Document ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ doc_id }) => {
      try {
        return text(await getDocument(doc_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_document_files",
    {
      title: "List document files",
      description: "Files attached to a document (requires TEEDY_AUTH_TOKEN).",
      inputSchema: z.object({
        doc_id: z.string().describe("Document ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ doc_id }) => {
      try {
        return text(await listDocumentFiles(doc_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
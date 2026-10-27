import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { login, listDocuments, getDocument, listDocumentFiles, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "teedy-mcp",
        version: "1.0.0",
    });
    server.registerTool("login", {
        title: "Login",
        description: "Log in with username/password; returns the auth_token to set as TEEDY_AUTH_TOKEN.",
        inputSchema: z.object({
            username: z.string().describe("Teedy username."),
            password: z.string().describe("Teedy password.")
        }),
        annotations: MUTATING,
    }, async ({ username, password }) => {
        try {
            return text(await login(username, password));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_documents", {
        title: "List documents",
        description: "Documents in the Teedy inbox/library (requires TEEDY_AUTH_TOKEN).",
        inputSchema: z.object({
            search: z.string().describe("Full-text search query.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ search }) => {
        try {
            return text(await listDocuments(search));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_document", {
        title: "Get document",
        description: "Teedy document metadata by ID (requires TEEDY_AUTH_TOKEN).",
        inputSchema: z.object({
            doc_id: z.string().describe("Document ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ doc_id }) => {
        try {
            return text(await getDocument(doc_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_document_files", {
        title: "List document files",
        description: "Files attached to a document (requires TEEDY_AUTH_TOKEN).",
        inputSchema: z.object({
            doc_id: z.string().describe("Document ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ doc_id }) => {
        try {
            return text(await listDocumentFiles(doc_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "teedy-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}

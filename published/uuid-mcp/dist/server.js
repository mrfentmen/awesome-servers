import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateMany } from "./local.js";
import { generateUuid } from "./local.js";
import { validateUuid, timeUuid } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "uuid-mcp", version: "1.0.0" });
    server.registerTool("generate_uuid", {
        title: "Generate uuid",
        description: "Generate a random UUID.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateUuid(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_many", {
        title: "Generate many",
        description: "Generate several UUIDs.",
        inputSchema: z.object({ count: z.number().describe("How many.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateMany(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("validate_uuid", {
        title: "Validate uuid",
        description: "Check if a string is a valid UUID.",
        inputSchema: z.object({ uuid: z.string().describe("String to check.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await validateUuid(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("uuid_info", {
        title: "UUID info",
        description: "Decode a UUID: its version and what that version means, its variant bits, and for a version 1 UUID the minting timestamp and node MAC.",
        inputSchema: z.object({ uuid: z.string().describe("UUID in the form 8-4-4-4-12 hex digits.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_time_uuid", {
        title: "Generate time-based UUID",
        description: "Generate a version 1 UUID through UUIDTools, with a timestamp and remote node identifier.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await timeUuid(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_name_uuid", {
        title: "Generate name-based UUID",
        description: "Generate a deterministic version 5 UUID through UUIDTools from a namespace and name.",
        inputSchema: z.object({ namespace: z.string().min(1).max(36).describe("ns:dns, ns:url, ns:oid, ns:x500 or a namespace UUID."), name: z.string().min(1).max(200).describe("Exact name to hash in the namespace.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement uuid locally (paywall removed)
        try {
            return textError("Not yet implemented: uuid");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "uuid-mcp";
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
    return server;
}

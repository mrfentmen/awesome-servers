import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatHit, formatMember, getMember, ParliamentError, searchMembers } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "ukparliament-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_members", {
        title: "Search members",
        description: "Search UK Parliament members (MPs and Lords) by name: party, constituency.",
        inputSchema: z.object({
            name: z.string().describe("Name to search, e.g. 'boris'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ name, limit }) => {
        try {
            const results = await searchMembers(name, limit);
            if (results.length === 0)
                return text(`No UK Parliament members match "${name}".`);
            return text(`UK Parliament members for "${name}":\n\n${results.map((h, i) => formatHit(h, i)).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_member", {
        title: "Get member details",
        description: "Get a UK Parliament member by id: party, constituency, house, status.",
        inputSchema: z.object({
            id: z.string().describe("Numeric member id, e.g. '1423' (use search_members to find it)"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const m = await getMember(id);
            if (!m)
                return text(`No UK Parliament member with id ${id}.`);
            return text(formatMember(m));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("member_career", {
        title: "Member career",
        description: "A UK Parliament member's full record: who they are, every constituency they have represented, their government and opposition posts, and their committee memberships.",
        inputSchema: z.object({ id: z.string().describe("Numeric member id, e.g. 4380.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement career locally (paywall removed)
        try {
            return textError("Not yet implemented: career");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ukparliament-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof ParliamentError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}

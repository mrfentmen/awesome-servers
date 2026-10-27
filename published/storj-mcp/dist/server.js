import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatObject, listBuckets, listObjects, StorjError, serviceStatus } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "storj-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_buckets", {
        title: "List buckets",
        description: "Storj buckets via S3. Set STORJ_ACCESS_KEY + STORJ_SECRET_KEY.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listBuckets();
            if (rows.length === 0)
                return text("No buckets.");
            return text(rows.map((b, i) => `${i + 1}. ${b}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_objects", {
        title: "List objects",
        description: "Objects in one bucket with sizes and dates.",
        inputSchema: z.object({
            bucket: z.string().describe("Bucket name"),
            prefix: z.string().default("").describe("Key prefix filter"),
            limit: z.number().int().min(1).max(100).default(20),
        }),
        annotations: READ_ONLY,
    }, async ({ bucket, prefix, limit }) => {
        try {
            const rows = await listObjects(bucket, prefix, limit);
            if (rows.length === 0)
                return text(`No objects in ${bucket}.`);
            return text(rows.map((o, i) => formatObject(o, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("service_status", {
        title: "Storj service status",
        description: "Live status of the Storj distributed cloud satellites and their APIs, billing and gateway, from the public status page. No account needed.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await serviceStatus());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("storage_key_audit", {
        title: "Audit object keys",
        description: "Audit a pasted list of S3/Storj object keys: prefix and extension layout, depth, date partitioning, sizes, and hygiene problems like double extensions, temp artefacts and unportable characters. Local, no keys needed.",
        inputSchema: z.object({
            keys: z.string().describe("One object key per line; optionally 'key<TAB>bytes'"),
            bucket: z.string().optional().describe("Bucket the keys belong to, for the report header"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement audit locally (paywall removed)
        try {
            return textError("Not yet implemented: audit");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "storj-mcp";
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
function errorMessage(e) {
    if (e instanceof StorjError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}

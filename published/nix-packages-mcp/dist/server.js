import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, listReleases } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "nix-packages-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search nixpkgs packages.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_releases", {
        title: "List nixpkgs channel releases",
        description: "The nixpkgs channel release index from the nix-releases bucket: every 24.05/24.11/25.05 channel release with its git revision, publish date and nixexprs size.",
        inputSchema: z.object({ series: z.string().describe("Series filter, e.g. '24.11' or '25.05'. Empty = all.").optional(), limit: z.number().describe("How many releases, 1-40.").default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listReleases({ series: args.series, limit: args.limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_attributes", {
        title: "List top-level package attributes",
        description: "The authoritative set of top-level nixpkgs attributes from all-packages.nix, optionally filtered to attributes in a group like APPLICATIONS or DEVELOPMENT.",
        inputSchema: z.object({ group: z.string().describe("Group fragment, e.g. 'APPLICATIONS', 'COMPILERS'. Empty = all groups.").optional(), limit: z.number().describe("How many attributes, 1-200.").default(25) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement attributes locally (paywall removed)
        try {
            return textError("Not yet implemented: attributes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("attribute_groups", {
        title: "Count package attributes by group",
        description: "How many top-level nixpkgs attributes sit in each all-packages.nix group, largest first - the shape of the package collection.",
        inputSchema: z.object({ limit: z.number().describe("How many groups, 1-60.").default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement groups locally (paywall removed)
        try {
            return textError("Not yet implemented: groups");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nix-packages-mcp";
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

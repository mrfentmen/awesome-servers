import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectDeprecationRadar, inspectVersionPins, inspectEndpointInventory } from "./core.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "api-deprecation-radar-mcp", version: "1.0.0" });
    server.registerTool("inspect_deprecation_radar", {
        title: "Inspect deprecation radar",
        description: "Count local API deprecation markers by broad severity without returning endpoint names, paths, values, or source.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await inspectDeprecationRadar(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("inspect_version_pins", {
        title: "Inspect version pins",
        description: "Read every dependency manifest in a project and classify version specifiers as exact, caret, tilde, wildcard, unbounded or floating, with the share of specifications that can drift on a fresh install.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default("."), pin: z.string().max(200).optional() }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(format(await inspectVersionPins(input)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("inspect_endpoint_inventory", {
        title: "Inspect endpoint inventory",
        description: "Inventory the hard coded HTTP and HTTPS endpoints in a project, collapsing resource ids, counting versioned paths, and flagging every plain http call as insecure.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default("."), scheme: z.string().max(10).optional() }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(format(await inspectEndpointInventory(input)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("runtime_lifecycle", {
        title: "Runtime lifecycle",
        description: "Read current release, support and end of life dates for a runtime from endoflife.date.",
        inputSchema: z.object({ product: z.string().describe("Product slug such as nodejs or python; defaults to nodejs.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lifecycle locally (paywall removed)
        try {
            return textError("Not yet implemented: lifecycle");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("npm_latest", {
        title: "npm latest metadata",
        description: "Read the latest npm package version, license, modified time, deprecation notice and homepage.",
        inputSchema: z.object({ package: z.string().describe("npm package name; defaults to request.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement latest locally (paywall removed)
        try {
            return textError("Not yet implemented: latest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "api-deprecation-radar-mcp";
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
    return server;
}

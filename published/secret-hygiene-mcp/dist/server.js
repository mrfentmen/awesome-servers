import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, scanSecretHygiene } from "./core.js";
import { secretExposureLedger } from "./api.js";
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const text = (value) => ({ content: [{ type: "text", text: value }] });
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "secret-hygiene-mcp", version: "1.0.0" });
    const serverName = "secret-hygiene-mcp";
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
    server.registerTool("scan_secret_hygiene", {
        title: "Scan secret hygiene",
        description: "Count secret-like patterns in bounded local files without returning values, keys, paths, filenames, or matches.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await scanSecretHygiene(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("entropy_profile", {
        title: "Entropy profile",
        description: "Profile candidate secrets you supply: Shannon entropy per character, length, character-class composition, unique-character ratio and a strength band for each. No candidate value, fragment or derived substring is ever returned.",
        inputSchema: z.object({ candidates: z.array(z.string().max(4096)).min(1).max(50).describe("Candidate secret values to profile, up to 50 of 4096 characters each.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("secret_exposure_ledger", {
        title: "Secret exposure ledger",
        description: "Run a redacted ledger over text you supply: per-family hit counts, a match-by-match list of lengths and character-class shapes, duplicate-value detection and a rotate-or-clear verdict. Values, offsets, paths and source lines are never returned.",
        inputSchema: z.object({ text: z.string().min(1).max(200000).describe("Text to scan, up to 200,000 characters.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await secretExposureLedger(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    return server;
}

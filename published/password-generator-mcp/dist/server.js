import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generatePassword, passphrase, passwordPatterns } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "password-generator-mcp", version: "1.0.0" });
    server.registerTool("generate_password", {
        title: "Generate password",
        description: "Generate a random password with options.",
        inputSchema: z.object({ length: z.number().describe("Length.").optional(), symbols: z.boolean().describe("Include symbols.").optional(), numbers: z.boolean().describe("Include numbers.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generatePassword(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("passphrase", {
        title: "Passphrase",
        description: "Generate a random passphrase of words.",
        inputSchema: z.object({ words: z.number().describe("Number of words.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await passphrase(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("password_entropy", {
        title: "Password entropy",
        description: "Measure a password you already have: pool size, nominal and Shannon entropy, repeat penalty, an effective bit count and a crack time at a rate you choose. Pure local maths.",
        inputSchema: z.object({ password: z.string().describe("The password to measure, up to 4096 characters."), guessesPerSecond: z.number().describe("Attack rate for the crack-time estimate, default 1e10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement entropy locally (paywall removed)
        try {
            return textError("Not yet implemented: entropy");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("password_patterns", {
        title: "Password patterns",
        description: "Find guessable patterns in a password: repeated runs, ascending or descending sequences, QWERTY keyboard walks, years and long lowercase word runs.",
        inputSchema: z.object({ password: z.string().describe("The password to inspect, up to 4096 characters.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await passwordPatterns(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "password-generator-mcp";
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

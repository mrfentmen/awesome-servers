import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_users, m1_generate, m1_seed } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'randomuser-mcp', version: '1.0.0' });
    server.registerTool("users", {
        title: "Users",
        description: "Random user profiles.",
        inputSchema: z.object({ count: z.number().describe("Number of users.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_users(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate", {
        title: "Generate",
        description: "Generate random user profiles.",
        inputSchema: z.object({ count: z.number().describe("How many profiles.").optional(), gender: z.string().describe("male, female, or any.").optional(), nat: z.string().describe("Nationality code, for example us or gb.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_generate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("seed", {
        title: "Seed",
        description: "Generate the same profiles every time with a seed.",
        inputSchema: z.object({ seed: z.string().describe("Seed value."), count: z.number().describe("How many profiles.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_seed(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("field_subset", {
        title: "Field subset",
        description: "Random user profiles limited to the fields you name, or with fields excluded, so you can fill a form without pulling everything.",
        inputSchema: z.object({ count: z.number().describe("How many profiles.").optional(), include: z.string().describe("Comma-separated fields to include, e.g. name,email,login.").optional(), exclude: z.string().describe("Comma-separated fields to exclude, e.g. phone,location.").optional(), nat: z.string().describe("Nationality code, for example us or gb.").optional(), gender: z.string().describe("male or female.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement subset locally (paywall removed)
        try {
            return textError("Not yet implemented: subset");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "randomuser-mcp";
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

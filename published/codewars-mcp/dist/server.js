import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CodewarsError, formatKata, formatUser, getKata, getUser, completedKata, supportedLanguages } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "codewars-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_user", {
        title: "Get user",
        description: "A Codewars user: honor, rank, clan, languages, completed kata.",
        inputSchema: z.object({
            username: z.string().describe("Codewars username"),
        }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            return text(formatUser(await getUser(username)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_kata", {
        title: "Get kata",
        description: "One kata by id or slug: name, rank, tags.",
        inputSchema: z.object({
            id_or_slug: z.string().describe("Kata id or slug, e.g. 'valid-parentheses'"),
        }),
        annotations: READ_ONLY,
    }, async ({ id_or_slug }) => {
        try {
            return text(formatKata(await getKata(id_or_slug)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("completed_kata", {
        title: "Completed kata",
        description: "The kata a Codewars user has completed, most recent first, with the language and date for each and the total count.",
        inputSchema: z.object({
            username: z.string().describe("Codewars username"),
            page: z.number().describe("Which page of 200 to read, 1-50").optional(),
            limit: z.number().describe("Max kata to list, 1-50").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await completedKata(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("language_progress", {
        title: "Language progress",
        description: "Which languages a Codewars user's recent completed kata are written in, ranked by how many, with the most recent date in each.",
        inputSchema: z.object({
            username: z.string().describe("Codewars username"),
            limit: z.number().describe("Max languages to list, 1-30").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement progress locally (paywall removed)
        try {
            return textError("Not yet implemented: progress");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("completion_timeline", {
        title: "Completion timeline",
        description: "How many kata a Codewars user completed in each year, taken from their most recent completions.",
        inputSchema: z.object({
            username: z.string().describe("Codewars username"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement timeline locally (paywall removed)
        try {
            return textError("Not yet implemented: timeline");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("supported_languages", {
        title: "Supported languages",
        description: "The languages Codewars supports, optionally filtered by name, with the id the API uses for each.",
        inputSchema: z.object({
            filter: z.string().describe("Substring to match against language name or id").optional(),
            limit: z.number().describe("Max languages to list, 1-58").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await supportedLanguages(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "codewars-mcp";
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
function errorMessage(e) {
    if (e instanceof CodewarsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}

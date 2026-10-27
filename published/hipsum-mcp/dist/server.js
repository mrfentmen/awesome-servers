import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generate, placeholderBlock } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "hipsum-mcp", version: "1.0.0" });
    server.registerTool("generate", {
        title: "Generate",
        description: "Generate hipster text.",
        inputSchema: z.object({ sentences: z.number().describe("Sentence count.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_paragraphs", {
        title: "Generate paragraphs",
        description: "The paragraph form of the Hipsum API, which the sentence tool never uses: the paras parameter, both documented types (hipster-latin and hipster-centric) and the start-with-lorem flag.",
        inputSchema: z.object({ type: z.string().describe("hipster-latin (default) or hipster-centric.").optional(), paragraphs: z.number().describe("Number of paragraphs, 1-20.").optional(), startWithLorem: z.boolean().describe("Start the first paragraph with the documented phrase.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement paragraphs locally (paywall removed)
        try {
            return textError("Not yet implemented: paragraphs");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lexicon_census", {
        title: "Lexicon census",
        description: "The vocabulary behind a Hipsum body: total and distinct word counts, the type-token ratio, mean words per sentence, which words repeat and how often, how much of it is classic Lorem ipsum Latin and which terms, and the longest words used.",
        inputSchema: z.object({ type: z.string().describe("hipster-latin (default) or hipster-centric.").optional(), paragraphs: z.number().describe("Paragraphs to pull and analyse, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement census locally (paywall removed)
        try {
            return textError("Not yet implemented: census");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("placeholder_block", {
        title: "Placeholder block",
        description: "A Hipsum body cut to an exact word budget per paragraph, for when placeholder copy has to fit a layout: the requested paragraphs of exactly that many words each, with a note of how much of the pool went unused.",
        inputSchema: z.object({ wordsPerParagraph: z.number().describe("Words per paragraph, 5-300.").optional(), paragraphs: z.number().describe("Paragraphs to produce, 1-10.").optional(), type: z.string().describe("hipster-latin (default) or hipster-centric.").optional(), startWithLorem: z.boolean().describe("Start the first paragraph with the documented phrase.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await placeholderBlock(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "hipsum-mcp";
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

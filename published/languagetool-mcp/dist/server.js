import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkText, formatResult, LanguageToolError, listLanguages, usageExamples } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "languagetool-mcp",
        version: "1.0.0",
    });
    server.registerTool("check_text", {
        title: "Check grammar",
        description: "Check grammar, spelling and style in 30+ languages. Returns issues with fix suggestions.",
        inputSchema: z.object({
            text: z.string().max(20000).describe("Text to check (max 20000 chars)"),
            language: z.string().default("auto").describe("Language code like 'en-US', 'de', 'fr', or 'auto'"),
        }),
        annotations: READ_ONLY,
    }, async ({ text: input, language }) => {
        try {
            return text(formatResult(await checkText(input, language)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_languages", {
        title: "List languages",
        description: "Supported LanguageTool language codes.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const langs = await listLanguages();
            return text(langs.map((l) => `${l.code} — ${l.name}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("translate_text", {
        title: "Translate text",
        description: "Translate up to 500 characters between two languages with the MyMemory public API, including match quality.",
        inputSchema: z.object({
            text: z.string().max(500).describe("Text to translate (max 500 chars)"),
            from: z.string().default("en").describe("Source language code, e.g. 'en'"),
            to: z.string().describe("Target language code, e.g. 'de'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement text locally (paywall removed)
        try {
            return textError("Not yet implemented: text");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_lookup", {
        title: "Word lookup",
        description: "Look up a word with Datamuse: spelling variants, matching words, rhymes or definitions.",
        inputSchema: z.object({
            word: z.string().min(1).max(80).describe("Word to look up"),
            relation: z.enum(["spelling", "match", "rhyme", "define"]).describe("What to look for"),
            limit: z.number().int().min(1).max(25).default(8).describe("Max results"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("word_pronunciation", {
        title: "Word pronunciation",
        description: "English IPA transcriptions and recorded pronunciation links with source and license from Free Dictionary API.",
        inputSchema: z.object({ word: z.string().min(1).max(80).describe("English word."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement pronunciation locally (paywall removed)
        try {
            return textError("Not yet implemented: pronunciation");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("usage_examples", {
        title: "Usage examples",
        description: "Real dictionary example sentences grouped with the part of speech and sense they illustrate.",
        inputSchema: z.object({ word: z.string().min(1).max(80).describe("English word."), limit: z.number().int().min(1).max(15).optional(), }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await usageExamples(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "languagetool-mcp";
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
    if (e instanceof LanguageToolError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}

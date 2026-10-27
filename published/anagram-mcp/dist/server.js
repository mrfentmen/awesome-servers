import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { anagramsOf, checkAnagram, letterProfile } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "anagram-mcp", version: "1.0.0" });
    server.registerTool("check_anagram", {
        title: "Check anagram",
        description: "Check if two words are anagrams.",
        inputSchema: z.object({ a: z.string().describe("First word."), b: z.string().describe("Second word.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await checkAnagram(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("anagrams_of", {
        title: "Anagrams of",
        description: "Generate anagrams of a word.",
        inputSchema: z.object({ word: z.string().describe("Word to rearrange."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await anagramsOf(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("group_anagrams", {
        title: "Group anagrams",
        description: "Bucket a list of words into anagram families, reporting which words share letters and which have no partner.",
        inputSchema: z.object({ words: z.string().describe("Words separated by commas or newlines.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement anagrams locally (paywall removed)
        try {
            return textError("Not yet implemented: anagrams");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("phrase_anagrams", {
        title: "Phrase anagrams",
        description: "Rearrange the letters of a multi word phrase while keeping each word the same length.",
        inputSchema: z.object({ phrase: z.string().describe("Phrase, e.g. a Christmas Carol."), limit: z.number().describe("Max rearrangements.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement anagrams locally (paywall removed)
        try {
            return textError("Not yet implemented: anagrams");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("letter_profile", {
        title: "Letter profile",
        description: "Letter frequency, vowel ratio, repeats and the anagram signature of a word or phrase.",
        inputSchema: z.object({ text: z.string().describe("Word or phrase to profile.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await letterProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "anagram-mcp";
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

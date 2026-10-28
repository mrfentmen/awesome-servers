import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPassage, listTranslations, randomVerse, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "bible-api-mcp", version: "1.0.0" });
    server.tool("get_passage", "Fetch a verse, chapter or passage by reference.", {
        reference: z.string().min(3).describe("Reference, e.g. john 3:16, psalm 23 or gen 1:1-5"),
        translation: z.string().default("kjv").describe("Translation id, e.g. kjv, web, asv, darby")
    }, async (a) => {
        try {
            return text(await getPassage(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("random_verse", "One random verse from a translation.", {
        translation: z.string().default("kjv").describe("Translation id, e.g. kjv, web, asv")
    }, async (a) => {
        try {
            return text(await randomVerse(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_translations", "Every translation the service offers, with language and licence.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await listTranslations());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

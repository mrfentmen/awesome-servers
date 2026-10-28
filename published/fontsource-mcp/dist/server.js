import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { list, subsetFinder } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fontsource-mcp", version: "1.0.0" });
    server.registerTool("list", {
        title: "List",
        description: "List available fonts.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await list(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("font_census", {
        title: "Font census",
        description: "The whole Fontsource catalogue as a census: how many fonts sit in each category, licence and source type, how many are variable or carry an italic, the style coverage, the default subset spread, the weight count range, how many distinct subsets are named and when the catalogue was last touched.",
        inputSchema: z.object({ limit: z.number().describe("Values to list per distribution, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: font_census ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_fontsource_font_census", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("font_details", {
        title: "Font details",
        description: "The full record for one font from Fontsource's per font endpoint: category, licence, upstream source, whether it is variable, its weights, styles, default subset, the unicode range behind a subset, the spec and npm versions, how many variant file groups exist, and the install and stylesheet URLs.",
        inputSchema: z.object({ id: z.string().describe("Fontsource font id, e.g. inter or roboto."), limit: z.number().describe("Weight groups to list, 1-12.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: font_details ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_fontsource_font_details", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("subset_finder", {
        title: "Subset finder",
        description: "Which fonts carry a given language or script subset and which of the catalogue do not: the share, how many are variable, their category mix, and each matching font with its licence.",
        inputSchema: z.object({ subset: z.string().describe("Subset name, e.g. cyrillic, arabic, greek, vietnamese, devanagari."), limit: z.number().describe("Fonts to list, 1-60.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await subsetFinder(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}

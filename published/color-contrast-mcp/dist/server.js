import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkWcag, contrastRatio, suggestAccessible, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "color-contrast-mcp", version: "1.0.0" });
    server.tool("contrast_ratio", "WCAG contrast ratio between two hex colours.", {
        foreground: z.string().describe("Text colour, e.g. #333333"),
        background: z.string().describe("Background colour")
    }, async (a) => {
        try {
            return text(await contrastRatio(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("check_wcag", "Check AA and AAA pass/fail for normal and large text.", {
        foreground: z.string().describe("Text colour"),
        background: z.string().describe("Background colour")
    }, async (a) => {
        try {
            return text(await checkWcag(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("suggest_accessible", "Adjust a colour until it meets a target contrast ratio against a background.", {
        foreground: z.string().describe("Starting text colour"),
        background: z.string().describe("Background colour"),
        target: z.number().min(1).max(21).default(4.5).describe("Target ratio (4.5 is AA normal text)")
    }, async (a) => {
        try {
            return text(await suggestAccessible(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}

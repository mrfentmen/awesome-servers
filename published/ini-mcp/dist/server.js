import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createIni, iniToJson, parseIniFile, validateIni, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ini-mcp", version: "1.0.0" });
    server.tool("parse_ini", "Parse INI text into sections and keys, with inline comments handled and problems reported.", {
        text: z.string().describe('INI text')
    }, async (a) => {
        try {
            return text(await parseIniFile(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("ini_to_json", "Convert INI text into a JSON object keyed by section.", {
        text: z.string().describe('INI text'), mergeDuplicateSections: z.boolean().optional().describe('Allow a section to appear more than once')
    }, async (a) => {
        try {
            return text(await iniToJson(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("create_ini", "Build INI text from a JSON object: scalars go at the top, nested objects become sections.", {
        json: z.string().describe('JSON object to turn into INI')
    }, async (a) => {
        try {
            return text(await createIni(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("validate_ini", "Check INI text for structural problems: bad lines, unterminated quotes, duplicate sections and keys.", {
        text: z.string().describe('INI text')
    }, async (a) => {
        try {
            return text(await validateIni(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

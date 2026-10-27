import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { decodeMorse, encodeMorse, morseReference, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "morse-mcp", version: "1.0.0" });
    server.tool("encode_morse", "Encode text as International Morse Code.", {
        text: z.string().min(1).max(2000).describe("Text to encode")
    }, async (a) => {
        try {
            return text(await encodeMorse(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("decode_morse", "Decode Morse Code back to text.", {
        morse: z.string().min(1).max(4000).describe("Morse with spaces between letters and / between words")
    }, async (a) => {
        try {
            return text(await decodeMorse(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("morse_reference", "Look up the Morse pattern for one character or list the whole table.", {
        character: z.string().max(1).optional().describe("Single character to look up; omit for the full table")
    }, async (a) => {
        try {
            return text(await morseReference(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}

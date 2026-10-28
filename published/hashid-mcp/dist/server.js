import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hashDetails, hashLengths, identifyHash, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "hashid-mcp", version: "1.0.0" });
    server.tool("identify_hash", "Guess which hash algorithm(s) produced a string, with hashcat mode numbers where known.", {
        text: z.string().min(1).max(512).describe("The hash text, e.g. 5d41402abc4b2a76b9719d911017c592")
    }, async (a) => {
        try {
            return text(await identifyHash(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("hash_details", "Parse the structure of a password hash: bcrypt cost and salt, argon2 parameters, SHA-crypt rounds and salts.", {
        text: z.string().min(1).max(512).describe("A password hash string like $2b$10$... or $argon2id$v=19$...")
    }, async (a) => {
        try {
            return text(await hashDetails(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("hash_lengths", "Reference table of common hash algorithms: hex length, byte length and hashcat mode.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await hashLengths());
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

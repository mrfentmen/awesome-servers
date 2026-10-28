import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkPasswordStrength, generatePassphrase, generatePassword, listPasswordWords, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "password-mcp", version: "1.0.0" });
    server.tool("generate_password", "Random password using Node's crypto RNG, with an unbiased shuffle and a per-class character guarantee.", {
        length: z.number().int().min(8).max(128).optional().describe('Characters, default 20'), upper: z.boolean().optional().describe('Include upper case, default true'), digits: z.boolean().optional().describe('Include digits, default true'), symbols: z.boolean().optional().describe('Include symbols, default false'), excludeAmbiguous: z.boolean().optional().describe('Skip look-alike characters like l, 1 and O, default true')
    }, async (a) => {
        try {
            return text(await generatePassword(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("generate_passphrase", "Passphrase drawn from the built-in word list, with an honest entropy estimate.", {
        words: z.number().int().min(3).max(10).optional().describe('Number of words, default 5'), separator: z.string().optional().describe('Joiner, default -'), capitalise: z.boolean().optional().describe('Capitalise each word')
    }, async (a) => {
        try {
            return text(await generatePassphrase(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("check_password_strength", "Estimate the entropy of a password, flag repeated runs, sequences and dictionary words, and suggest fixes.", {
        password: z.string().describe('Password to assess')
    }, async (a) => {
        try {
            return text(await checkPasswordStrength(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_password_words", "Look at the words the passphrase generator draws from.", {
        search: z.string().optional().describe('Substring filter, e.g. "anchor"')
    }, async (a) => {
        try {
            return text(await listPasswordWords(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

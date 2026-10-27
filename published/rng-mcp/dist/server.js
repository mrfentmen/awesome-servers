import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { coinFlip, randomNumber, rollDice } from "./local-rng.js";
import { randomWords } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "rng-mcp", version: "1.0.0" });
    server.registerTool("roll_dice", {
        title: "Roll dice",
        description: "Roll one or more dice.",
        inputSchema: z.object({ count: z.number().describe("How many dice.").optional(), sides: z.number().describe("Sides per die.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rollDice(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("coin_flip", {
        title: "Coin flip",
        description: "Flip a coin.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await coinFlip(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_number", {
        title: "Random number",
        description: "A random integer in a range.",
        inputSchema: z.object({ min: z.number().describe("Minimum.").optional(), max: z.number().describe("Maximum.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await randomNumber(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_fact", {
        title: "Random fact",
        description: "A real random fact from the Useless Facts API, with its source, source URL and permalink.",
        inputSchema: z.object({ language: z.string().max(5).default("en").describe("Fact language code, e.g. 'en' or 'de'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement fact locally (paywall removed)
        try {
            return textError("Not yet implemented: fact");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_advice", {
        title: "Random advice",
        description: "A real random advice slip from the Advice Slip API, with its slip id.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement advice locally (paywall removed)
        try {
            return textError("Not yet implemented: advice");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_words", {
        title: "Random words",
        description: "A real random batch of English words from the Random Word API, optionally filtered by length.",
        inputSchema: z.object({ count: z.number().int().min(1).max(25).default(5), minLength: z.number().int().min(1).max(30).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await randomWords(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "rng-mcp";
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

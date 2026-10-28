import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bestHandOfSeven, compareHands, evaluateHand, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "poker-mcp", version: "1.0.0" });
    server.tool("evaluate_hand", "Rank a five-card poker hand and show its tiebreak cards.", {
        cards: z.array(z.string()).length(5).describe('Five cards like ["As","Kd","Qh","Jc","Ts"]')
    }, async (a) => {
        try {
            return text(await evaluateHand(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("compare_hands", "Compare two five-card hands and say which wins.", {
        first: z.array(z.string()).length(5).describe("First hand"),
        second: z.array(z.string()).length(5).describe("Second hand")
    }, async (a) => {
        try {
            return text(await compareHands(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("best_hand_of_seven", "Choose the best five-card hand from seven cards.", {
        cards: z.array(z.string()).length(7).describe("Seven cards")
    }, async (a) => {
        try {
            return text(await bestHandOfSeven(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { chooseNumbers, combinationsOf, factorialOf, fibonacciOf, permutationsOf, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "combinatorics-mcp", version: "1.0.0" });
    server.tool("factorial_of", "Exact factorial using BigInt, with digit count and trailing zeros.", {
        n: z.number().int().min(0).max(5000).describe('Whole number, up to 5000')
    }, async (a) => {
        try {
            return text(await factorialOf(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("choose_numbers", "Exact nCr (combinations) or nPr (permutations) for large n, computed with BigInt.", {
        n: z.number().int().min(0).max(100000).describe('Pool size'), r: z.number().int().min(0).describe('How many to pick'), kind: z.enum(['combinations', 'permutations']).optional().describe('Default combinations')
    }, async (a) => {
        try {
            return text(await chooseNumbers(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("fibonacci_of", "Exact Fibonacci number with BigInt and its digit count.", {
        n: z.number().int().min(0).max(20000).describe('Index, up to 20000')
    }, async (a) => {
        try {
            return text(await fibonacciOf(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("permutations_of", "List every ordering of up to 8 items, with the exact total.", {
        items: z.string().describe('Comma-separated items, up to 8'), limit: z.number().int().min(1).max(500).optional().describe('Rows to list, default 50')
    }, async (a) => {
        try {
            return text(await permutationsOf(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("combinations_of", "List every way to choose k items from a list, with the exact total.", {
        items: z.string().describe('Comma-separated items, up to 12'), choose: z.number().int().min(1).describe('How many to choose'), limit: z.number().int().min(1).max(500).optional().describe('Rows to list, default 50')
    }, async (a) => {
        try {
            return text(await combinationsOf(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { factorise, isPrime, nextPrime, primesInRange, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "primes-mcp", version: "1.0.0" });
    server.tool("is_prime", "Test whether a whole number is prime with deterministic Miller-Rabin up to 10^30.", {
        n: z.string().describe('Whole number, decimal or 0x hex, e.g. "170141183460469231731687303715884105727"')
    }, async (a) => {
        try {
            return text(await isPrime(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("factorise", "Factorise a number into primes using trial division and Pollard rho, with powers grouped.", {
        n: z.string().describe('Whole number up to 10^24')
    }, async (a) => {
        try {
            return text(await factorise(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("primes_in_range", "Find every prime in a numeric range with a segmented sieve.", {
        from: z.number().int().min(0).describe('Start of the range'), to: z.number().int().min(0).max(20000000).describe('End of the range, up to 20000000'), limit: z.number().int().min(1).max(1000).optional().describe('Primes to list, default 50')
    }, async (a) => {
        try {
            return text(await primesInRange(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("next_prime", "The next prime strictly above a number, with the gap.", {
        n: z.string().describe('Whole number, decimal or 0x hex')
    }, async (a) => {
        try {
            return text(await nextPrime(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

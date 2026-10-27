import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { detectLifeCycle, evolveLife, lifeStats, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "game-of-life-mcp", version: "1.0.0" });
    server.tool("evolve_life", "Evolve a Life grid for N generations and return the final board.", {
        grid: z.array(z.string()).min(3).describe("Grid rows using # for alive and . for dead"),
        generations: z.number().int().min(0).max(500).default(1).describe("Generations to run"),
        wrap: z.boolean().default(false).describe("Wrap edges like a torus")
    }, async (a) => {
        try {
            return text(await evolveLife(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("life_stats", "Population, density and bounding box of a Life pattern.", {
        grid: z.array(z.string()).min(1).describe("Grid rows using # for alive and . for dead")
    }, async (a) => {
        try {
            return text(await lifeStats(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("detect_life_cycle", "Find the period or extinction point of a pattern.", {
        grid: z.array(z.string()).min(1).describe("Starting pattern"),
        maxGenerations: z.number().int().min(1).max(200).default(50).describe("How long to watch")
    }, async (a) => {
        try {
            return text(await detectLifeCycle(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}

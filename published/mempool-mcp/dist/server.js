import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addressInfo, blockInfo, difficultyAdjustment, MempoolError, mempoolStats, recentBlocks, recommendedFees, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof MempoolError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "mempool-mcp", version: "1.0.0" });
    server.tool("recommended_fees", "Current Bitcoin fee estimates in sat/vB by confirmation speed.", {}, async () => {
        try {
            return text(await recommendedFees());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("mempool_stats", "How many transactions are waiting and how much fee is queued.", {}, async () => {
        try {
            return text(await mempoolStats());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("recent_blocks", "The most recently mined Bitcoin blocks.", { limit: z.number().int().min(1).max(15).default(5).describe("Blocks to return") }, async ({ limit }) => {
        try {
            return text(await recentBlocks(limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("block_info", "Details for one block, by height or hash.", { block: z.string().min(1).describe("Height (e.g. 800000) or 64-character hash") }, async ({ block }) => {
        try {
            return text(await blockInfo(block));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("address_info", "Confirmed and unconfirmed balance and transaction counts for a Bitcoin address.", { address: z.string().min(14).describe("Bitcoin address") }, async ({ address }) => {
        try {
            return text(await addressInfo(address));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("difficulty_adjustment", "Progress and estimate for the next Bitcoin difficulty retarget.", {}, async () => {
        try {
            return text(await difficultyAdjustment());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

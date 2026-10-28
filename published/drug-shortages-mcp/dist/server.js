import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search_shortages, shortages_by_status, shortages_by_manufacturer, shortage_by_ndc, search_by_brand, shortage_stats, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "drug-shortages-mcp", version: "1.0.0" });
    server.tool("search_shortages", "Search drug shortages by generic or brand name", {
        term: z.string().min(2).describe("Drug name, e.g. bupivacaine"),
        limit: z.number().int().min(1).max(25).default(10).describe("Records to return")
    }, async (a) => {
        try {
            return text(await search_shortages(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("shortages_by_status", "Shortage records with a given availability status", {
        status: z.string().min(3).describe("Availability, e.g. Available, Currently in Shortage, Discontinued, Not Available, Resolved"),
        limit: z.number().int().min(1).max(25).default(10).describe("Records to return")
    }, async (a) => {
        try {
            return text(await shortages_by_status(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("shortages_by_manufacturer", "Shortage records for one manufacturer", {
        manufacturer: z.string().min(2).describe("Manufacturer name, e.g. Eugia"),
        limit: z.number().int().min(1).max(25).default(10).describe("Records to return")
    }, async (a) => {
        try {
            return text(await shortages_by_manufacturer(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("shortage_by_ndc", "Shortage records for one package NDC", {
        ndc: z.string().min(5).describe("Package NDC, e.g. 55150-169-10")
    }, async (a) => {
        try {
            return text(await shortage_by_ndc(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_by_brand", "Shortage records for a brand name", {
        brand: z.string().min(2).describe("Brand name, e.g. BUPIVACAINE"),
        limit: z.number().int().min(1).max(25).default(10).describe("Records to return")
    }, async (a) => {
        try {
            return text(await search_by_brand(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("shortage_stats", "Count of shortage records per availability status", {
    // no arguments
    }, async (a) => {
        try {
            return text(await shortage_stats(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

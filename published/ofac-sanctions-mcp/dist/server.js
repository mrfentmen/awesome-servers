import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { screen_name, entry_detail, entries_by_program, entries_by_type, list_stats, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ofac-sanctions-mcp", version: "1.0.0" });
    server.tool("screen_name", "Screen a person or company name against the SDN list", {
        name: z.string().min(2).describe("Name to screen, e.g. Lukashenko"),
        limit: z.number().int().min(1).max(50).default(10).describe("Maximum matches")
    }, async (a) => {
        try {
            return text(await screen_name(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("entry_detail", "One SDN entry by its OFAC number", {
        number: z.string().min(2).describe("OFAC ent_num, e.g. 6951")
    }, async (a) => {
        try {
            return text(await entry_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("entries_by_program", "SDN entries in one sanctions program", {
        program: z.string().min(2).describe("Program fragment, e.g. UKRAINE or IRAN"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum entries")
    }, async (a) => {
        try {
            return text(await entries_by_program(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("entries_by_type", "SDN entries of one type, such as vessels or entities", {
        type: z.enum(["individual", "entity", "vessel", "aircraft"]).describe("SDN type"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum entries")
    }, async (a) => {
        try {
            return text(await entries_by_type(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_stats", "How many SDN entries and which programs they cover", {
    // no arguments
    }, async (a) => {
        try {
            return text(await list_stats(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

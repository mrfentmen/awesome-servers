import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search_loinc, loinc_detail, search_icd10, icd10_detail, search_conditions, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "clinical-codes-mcp", version: "1.0.0" });
    server.tool("search_loinc", "Search LOINC lab and clinical observation codes", {
        term: z.string().min(2).describe("Search text, e.g. hemoglobin"),
        limit: z.number().int().min(1).max(25).default(10).describe("Codes to return")
    }, async (a) => {
        try {
            return text(await search_loinc(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("loinc_detail", "Look up one LOINC code", {
        code: z.string().min(2).describe("LOINC code, e.g. 54071-6")
    }, async (a) => {
        try {
            return text(await loinc_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_icd10", "Search ICD-10-CM diagnosis codes", {
        term: z.string().min(2).describe("Diagnosis text, e.g. diabetes"),
        limit: z.number().int().min(1).max(25).default(10).describe("Codes to return")
    }, async (a) => {
        try {
            return text(await search_icd10(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("icd10_detail", "Look up one ICD-10-CM code", {
        code: z.string().min(3).describe("ICD-10-CM code, e.g. E11.9")
    }, async (a) => {
        try {
            return text(await icd10_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_conditions", "Search consumer health condition names", {
        term: z.string().min(2).describe("Condition text, e.g. asthma"),
        limit: z.number().int().min(1).max(25).default(10).describe("Conditions to return")
    }, async (a) => {
        try {
            return text(await search_conditions(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

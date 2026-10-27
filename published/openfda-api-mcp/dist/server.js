import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { adverseEvents, drugLabels, labelSections, ndcLookup, OpenFdaError, recalls } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof OpenFdaError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "openfda-mcp", version: "1.1.1" });
    server.tool("drug_labels", "FDA-approved labels for a brand name, with route and approved use.", {
        name: z.string().min(2).describe("Brand name, e.g. Advil"),
        limit: z.number().int().min(1).max(20).default(5).describe("Labels to return"),
    }, async ({ name, limit }) => {
        try {
            return text(await drugLabels(name, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("label_sections", "Plain-language sections of the label: use, dosage, warnings, interactions.", { name: z.string().min(2).describe("Brand name, e.g. Lipitor") }, async ({ name }) => {
        try {
            return text(await labelSections(name));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("adverse_events", "Adverse-event reports naming a drug, with reaction terms and seriousness.", {
        drug: z.string().min(2).describe("Drug name as reported, e.g. ASPIRIN"),
        limit: z.number().int().min(1).max(50).default(10).describe("Reports to return"),
    }, async ({ drug, limit }) => {
        try {
            return text(await adverseEvents(drug, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("drug_recalls", "Drug enforcement reports (recalls) matching a term.", {
        term: z.string().min(2).describe("Product or brand text"),
        limit: z.number().int().min(1).max(50).default(10).describe("Recalls to return"),
    }, async ({ term, limit }) => {
        try {
            return text(await recalls("drug", term, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("device_recalls", "Medical device recalls matching a term.", {
        term: z.string().min(2).describe("Device description text"),
        limit: z.number().int().min(1).max(50).default(10).describe("Recalls to return"),
    }, async ({ term, limit }) => {
        try {
            return text(await recalls("device", term, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("food_recalls", "Food and cosmetic recalls matching a term.", {
        term: z.string().min(2).describe("Product description text, e.g. peanut butter"),
        limit: z.number().int().min(1).max(50).default(10).describe("Recalls to return"),
    }, async ({ term, limit }) => {
        try {
            return text(await recalls("food", term, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("ndc_lookup", "National Drug Code entries for a brand: dosage form, product type, packaging.", {
        name: z.string().min(2).describe("Brand name"),
        limit: z.number().int().min(1).max(25).default(5).describe("Entries to return"),
    }, async ({ name, limit }) => {
        try {
            return text(await ndcLookup(name, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}

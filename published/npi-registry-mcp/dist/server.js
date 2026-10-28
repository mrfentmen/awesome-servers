import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { providerByNpi, searchProviders, SourceError, searchOrganizations, providersByTaxonomy, providersByCity } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "npi-registry-mcp", version: "1.0.3" });
    server.tool("provider_by_npi", "Everything the registry holds for one NPI number.", {
        npi: z.string().regex(/^\d{10}$/).describe('10-digit NPI, e.g. "1234567893"')
    }, async (a) => {
        try {
            return text(await providerByNpi(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_providers", "Search providers by last name, first name, state and taxonomy description.", {
        lastName: z.string().min(2).optional().describe("Provider last name or organisation name"),
        firstName: z.string().min(1).optional().describe("Provider first name"),
        state: z.string().length(2).optional().describe("Two-letter state code"),
        taxonomies: z.string().min(3).optional().describe('Taxonomy description, e.g. "Cardiology"'),
        limit: z.number().int().min(1).max(20).default(5).describe("Providers to return")
    }, async (a) => {
        try {
            return text(await searchProviders(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("search_organizations", "Search organisations (hospitals, clinics, suppliers) by name.", {
        name: z.string().min(2).describe("Organisation name or part"),
        state: z.string().length(2).optional().describe("Two-letter state code"),
        city: z.string().min(2).optional().describe("City name"),
        limit: z.number().int().min(1).max(20).default(5).describe("Organisations to return")
    }, async (a) => {
        try {
            return text(await searchOrganizations(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("providers_by_taxonomy", "Providers with a given taxonomy, e.g. Cardiology.", {
        taxonomy: z.string().min(3).describe('Taxonomy description, e.g. "Cardiology"'),
        state: z.string().length(2).optional().describe("Two-letter state code"),
        limit: z.number().int().min(1).max(20).default(5).describe("Providers to return")
    }, async (a) => {
        try {
            return text(await providersByTaxonomy(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("providers_by_city", "Providers registered in a city.", {
        city: z.string().min(2).describe("City name, e.g. Boston"),
        state: z.string().length(2).describe("Two-letter state code"),
        limit: z.number().int().min(1).max(20).default(5).describe("Providers to return")
    }, async (a) => {
        try {
            return text(await providersByCity(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

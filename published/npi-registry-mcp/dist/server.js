import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { providerByNpi, searchProviders, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "npi-registry-mcp", version: "1.0.1" });
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
    return server;
}

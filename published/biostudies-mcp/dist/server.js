import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchStudies, studyDetail, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "biostudies-mcp", version: "1.0.0" });
    server.tool("search_studies", "Search BioStudies records by keyword.", {
        query: z.string().min(2).describe('Search text, e.g. "bronchiectasis"'),
        limit: z.number().int().min(1).max(25).default(8).describe("Studies to return")
    }, async (a) => {
        try {
            return text(await searchStudies(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("study_detail", "Read one BioStudies record by accession.", {
        accession: z.string().min(3).describe('Accession like "S-BSST1" or "S-EPMC10139049"')
    }, async (a) => {
        try {
            return text(await studyDetail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

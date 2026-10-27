import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { countDatasets, datasetDetail, searchDatasets, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "geo-mcp", version: "1.0.0" });
    server.tool("search_datasets", "Search GEO DataSets by keyword, organism or study type.", {
        term: z.string().min(2).describe('Search term, e.g. "triple negative breast cancer" or "GSE335330"'),
        limit: z.number().int().min(1).max(25).default(10).describe("Datasets to return")
    }, async (a) => {
        try {
            return text(await searchDatasets(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("count_datasets", "Count GEO DataSets matching a term, with the query translation NCBI used.", {
        term: z.string().min(2).describe("Search term")
    }, async (a) => {
        try {
            return text(await countDatasets(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("dataset_detail", "Full record for one GEO DataSet by UID or accession.", {
        uid: z.string().min(3).describe('GEO UID, e.g. 200335330, or accession GSE335330')
    }, async (a) => {
        try {
            return text(await datasetDetail(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}

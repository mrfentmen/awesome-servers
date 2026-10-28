import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listStudies, studyDetail, studyDesign, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "metabolights-mcp", version: "1.0.0" });
    server.tool("list_studies", "Public MetaboLights studies, optionally filtered by a keyword matched against the identifier, title or description.", {
        query: z.string().optional().describe("Optional keyword, e.g. urine or lipidomics"),
        limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    }, async (a) => {
        try {
            return text(await listStudies(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("study_detail", "One MetaboLights study in full: title, description, status, organisms, technologies and dates.", {
        studyId: z.string().min(3).describe("Study accession, e.g. MTBLS1")
    }, async (a) => {
        try {
            return text(await studyDetail(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("study_design", "Study design descriptors, experimental factors and measurement technologies for one study.", {
        studyId: z.string().min(3).describe("Study accession, e.g. MTBLS1")
    }, async (a) => {
        try {
            return text(await studyDesign(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

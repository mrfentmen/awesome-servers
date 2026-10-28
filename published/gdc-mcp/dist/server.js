import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findGenes, listProjects, projectDetail, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "gdc-mcp", version: "1.0.0" });
    server.tool("list_projects", "GDC cancer projects (TCGA, TARGET, CPTAC and others), optionally filtered by a keyword.", {
        query: z.string().optional().describe("Optional keyword matched against the project id, name or disease type, e.g. breast"),
        limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    }, async (a) => {
        try {
            return text(await listProjects(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("project_detail", "One GDC project in full: name, disease type, primary site, program and summary.", {
        projectId: z.string().min(3).describe("Project id, e.g. TCGA-BRCA")
    }, async (a) => {
        try {
            return text(await projectDetail(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("find_genes", "Look genes up in the GDC gene index by symbol: id, biotype, cytoband and canonical transcript length.", {
        symbols: z.string().min(1).describe("Comma-separated gene symbols, e.g. BRCA1,TP53,EGFR")
    }, async (a) => {
        try {
            return text(await findGenes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

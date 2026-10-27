import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PdbError, ligandInfo, searchStructures, structureChains, structureCitation, structureLigands, structureSummary, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof PdbError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "pdb-mcp", version: "1.0.0" });
    const id = z.string().length(4).describe("4-character PDB id, e.g. 4HHB");
    server.tool("search_structures", "Full-text search across every structure in the Protein Data Bank.", {
        query: z.string().min(2).describe("Search term, e.g. 'hemoglobin', 'CRISPR', 'SARS-CoV-2 spike'"),
        limit: z.number().int().min(1).max(50).default(10).describe("Ids to return (1-50)"),
    }, async ({ query, limit }) => {
        try {
            return text(await searchStructures(query, limit));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("structure_summary", "Title, experimental method, resolution, authors and molecule counts.", { pdbId: id }, async ({ pdbId }) => {
        try {
            return text(await structureSummary(pdbId));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("structure_chains", "Polymer entities: chain names, description and residue counts.", { pdbId: id }, async ({ pdbId }) => {
        try {
            return text(await structureChains(pdbId));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("structure_ligands", "Every bound ligand with its chemical component id and weight.", { pdbId: id }, async ({ pdbId }) => {
        try {
            return text(await structureLigands(pdbId));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("ligand_info", "Chemical component record: formula, weight and synonyms.", { compId: z.string().min(1).max(5).describe("Chemical component id, e.g. HEM") }, async ({ compId }) => {
        try {
            return text(await ligandInfo(compId));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("structure_citation", "The paper that published a structure, with DOI and PubMed id.", { pdbId: id }, async ({ pdbId }) => {
        try {
            return text(await structureCitation(pdbId));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSequence, listChromosomes, listGenomes, searchGenome, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ucsc-genome-mcp", version: "1.0.0" });
    server.tool("list_genomes", "Genomes hosted by UCSC, optionally filtered by name, organism or description.", {
        query: z.string().optional().describe("Optional substring matched against the assembly name, organism or description, e.g. human"),
        limit: z.number().int().min(1).max(50).default(20).describe("Rows to return")
    }, async (a) => {
        try {
            return text(await listGenomes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_chromosomes", "Chromosomes and scaffolds of one assembly, with sizes and the largest shown.", {
        genome: z.string().min(1).describe("Assembly id, e.g. hg38 or mm39"),
        limit: z.number().int().min(1).max(50).default(10).describe("Chromosomes to show by size")
    }, async (a) => {
        try {
            return text(await listChromosomes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("get_sequence", "DNA sequence for a coordinate range, with length, GC content and N count.", {
        genome: z.string().min(1).describe("Assembly id, e.g. hg38"),
        chrom: z.string().min(1).describe("Chromosome, e.g. chr17"),
        start: z.number().int().min(0).describe("Start coordinate (0-based)"),
        end: z.number().int().min(1).describe("End coordinate (exclusive)")
    }, async (a) => {
        try {
            return text(await getSequence(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("search_genome", "Search an assembly by gene or feature name and list the position matches with coordinates.", {
        term: z.string().min(1).describe("Search term, e.g. BRCA1"),
        genome: z.string().min(1).describe("Assembly id, e.g. hg38"),
        limit: z.number().int().min(1).max(20).default(5).describe("Tracks to show")
    }, async (a) => {
        try {
            return text(await searchGenome(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

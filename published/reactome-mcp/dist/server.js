import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatHit, formatPathway, getPathway, ReactomeError, searchPathways, pathway_structure } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "reactome-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_pathways", {
        title: "Search pathways",
        description: "Search Reactome for biological pathways, reactions, and molecules by keyword.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'apoptosis', 'BRCA1', 'glycolysis'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchPathways(query, limit);
            if (results.length === 0)
                return text(`No Reactome pathways match "${query}".`);
            return text(`Reactome results for "${query}":\n\n${results.map((h, i) => formatHit(h, i)).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_pathway", {
        title: "Get pathway details",
        description: "Get a Reactome pathway by stable id: summary, species, compartments, literature, diagram link.",
        inputSchema: z.object({
            stId: z.string().describe("Stable id, e.g. 'R-HSA-109581' (use search_pathways to find it)"),
        }),
        annotations: READ_ONLY,
    }, async ({ stId }) => {
        try {
            const p = await getPathway(stId);
            if (!p)
                return text(`No Reactome pathway ${stId}.`);
            return text(formatPathway(p));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pathway_structure", {
        title: "Pathway structure",
        description: "Read what is inside a Reactome pathway: how many chemical reactions, nested sub-pathways and black box events it contains, how many of those events are computationally inferred rather than curated, which are flagged as disease related, and the bare database ids Reactome declines to expand. get_pathway reports the pathway's own name, species and summary and says nothing about its contents.",
        inputSchema: z.object({
            stId: z.string().describe("Reactome stable id, e.g. 'R-HSA-109581'. Find one with search_pathways."),
        }),
        annotations: READ_ONLY,
    }, async ({ stId }) => {
        try {
            return text(await pathway_structure({ stId }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pathway_participants", {
        title: "Pathway participants",
        description: "Read the molecules taking part in a Reactome pathway: how many complexes, free proteins and sets, how many distinct accessions sit behind them, which accessions are reused across several participants, and the largest complexes by accession count with a median for comparison. Prints the full accession list so the result can be carried to another service. No existing tool looks at participants at all.",
        inputSchema: z.object({
            stId: z.string().describe("Reactome stable id, e.g. 'R-HSA-109581'."),
            limit: z.number().int().min(1).max(40).optional().describe("How many shared accessions and largest complexes to list. Default 12."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement participants locally (paywall removed)
        try {
            return textError("Not yet implemented: participants");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("pathway_tree", {
        title: "Sub-pathway tree",
        description: "Walk a Reactome pathway's sub-pathway hierarchy to a chosen depth and draw it, reporting the number of immediate children, the deepest level Reactome records beneath it, how many nodes carry a diagram, and whether the walk was cut short by the depth limit. The existing tools can only describe one pathway at a time and cannot show how it sits inside the larger structure.",
        inputSchema: z.object({
            stId: z.string().describe("Reactome stable id, e.g. 'R-HSA-109581'."),
            maxDepth: z.number().int().min(1).max(6).optional().describe("How many levels to walk. Default 3, which is four requests."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tree locally (paywall removed)
        try {
            return textError("Not yet implemented: tree");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("identifier_pathways", {
        title: "Pathways for an identifier",
        description: "Look a database identifier up in Reactome's own mapping index and list every pathway that identifier takes part in, with the pathway's level in the hierarchy and its disease, inferred and diagram flags. None of the other tools start from an accession: search_pathways searches text, and the rest start from a stable id you already have.",
        inputSchema: z.object({
            resource: z.string().describe("Source database name as Reactome knows it, e.g. UniProt, ENSEMBL or CHEBI."),
            identifier: z.string().describe("The bare accession, e.g. P04637."),
            limit: z.number().int().min(1).max(40).optional().describe("How many pathways to list. Default 20."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement pathways locally (paywall removed)
        try {
            return textError("Not yet implemented: pathways");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "reactome-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof ReactomeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}

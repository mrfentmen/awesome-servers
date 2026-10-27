import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, me, getFile, projectFiles, teamProjects, fileComments, fileVersions, fileComponents, fileStyles, fileNodes, fileImages, fileVariables, componentSets, fileStructure } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "figma-mcp",
        version: "1.0.0",
    });
    server.registerTool("me", {
        title: "My profile",
        description: "The Figma user the access token belongs to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await me());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_file", {
        title: "Get file",
        description: "File metadata: name, pages and last modified date.",
        inputSchema: z.object({
            file_key: z.string().describe("File key from URL.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key }) => {
        try {
            return text(await getFile(file_key));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("project_files", {
        title: "Project files",
        description: "Figma files inside one project id.",
        inputSchema: z.object({
            project_id: z.string().describe("Project ID from the Figma URL")
        }),
        annotations: READ_ONLY,
    }, async ({ project_id }) => {
        try {
            return text(await projectFiles(project_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("team_projects", {
        title: "Team projects",
        description: "Projects in a team.",
        inputSchema: z.object({
            team_id: z.string().describe("Team ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ team_id }) => {
        try {
            return text(await teamProjects(team_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_comments", {
        title: "File comments",
        description: "Comments on a file.",
        inputSchema: z.object({
            file_key: z.string().describe("File key.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key }) => {
        try {
            return text(await fileComments(file_key));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_versions", {
        title: "File versions",
        description: "Version history.",
        inputSchema: z.object({
            file_key: z.string().describe("File key.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key }) => {
        try {
            return text(await fileVersions(file_key));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_components", {
        title: "Components",
        description: "Published components.",
        inputSchema: z.object({
            file_key: z.string().describe("File key.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key }) => {
        try {
            return text(await fileComponents(file_key));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_styles", {
        title: "Styles",
        description: "Published styles.",
        inputSchema: z.object({
            file_key: z.string().describe("File key.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key }) => {
        try {
            return text(await fileStyles(file_key));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_nodes", {
        title: "File nodes",
        description: "Nodes by IDs.",
        inputSchema: z.object({
            file_key: z.string().describe("File key."),
            node_ids: z.string().describe("Comma-separated node IDs.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key, node_ids }) => {
        try {
            return text(await fileNodes(file_key, node_ids));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_images", {
        title: "Render nodes",
        description: "PNG renders.",
        inputSchema: z.object({
            file_key: z.string().describe("File key."),
            node_ids: z.string().describe("Comma-separated node IDs.")
        }),
        annotations: READ_ONLY,
    }, async ({ file_key, node_ids }) => {
        try {
            return text(await fileImages(file_key, node_ids));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_variables", {
        title: "Local variables and modes",
        description: "Lists the design-token layer of a Figma file: every variable collection, the variables in it, their resolved types, and the values per mode. Modes are how one variable name resolves differently per platform or theme, so a variable with three modes is three values rather than one value with three aliases, and exporting only the default mode drops the rest. Also flags variables holding an alias to another variable, which is the mechanism that makes a rename propagate. Does not list variables consumed from a shared library.",
        inputSchema: z.object({
            file_key: z.string().describe("Figma file key from the file URL."),
            collection: z.string().optional().describe("Restrict to a collection whose name contains this text."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fileVariables(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("component_sets", {
        title: "Component sets and variants",
        description: "Lists the component sets in a Figma file, which is where a component and its variants are defined, with the variant node ids and the description. The existing file_components returns component instances found in a file; a component set is the definition and the variant axes, which is what a design system needs to document and what nothing else here could reach. Flags sets with only one variant, which cannot vary anything yet, and sets with no description.",
        inputSchema: z.object({
            file_key: z.string().describe("Figma file key from the file URL."),
            include_properties: z.boolean().default(true).describe("Include documentation links when the set has them. Default true"),
            limit: z.number().int().min(1).max(200).default(30).describe("Sets to list, default 30"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await componentSets(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("file_structure", {
        title: "Document tree summary",
        description: "Walks a Figma file's document tree and reports page names, node counts by type and the deepest nesting, instead of returning the document. The existing getFile truncates at 12000 characters, so on any real file it returns the first canvas and a fragment of it, and a file with thousands of nodes cannot be inspected with it at all. Notes the cases that matter, such as instances with no component definition in the file, which means the system is not self-contained.",
        inputSchema: z.object({
            file_key: z.string().describe("Figma file key from the file URL."),
            max_nodes: z.number().int().min(100).max(200000).default(20000).describe("Node walk limit, default 20000"),
            top_n: z.number().int().min(1).max(60).default(12).describe("Node types to list, default 12"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fileStructure(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateMeme, listGenerators, MemeError, popularTemplates, randomTemplate, searchTemplates, templateInfo, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof MemeError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "meme-reference-mcp", version: "1.0.0" });
    server.tool("search_templates", "Find classic meme templates by name (Imgflip catalogue), ranked by how often they are used.", {
        query: z.string().min(2).describe("Words from the template name, e.g. drake or distracted"),
        limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    }, async ({ query, limit }) => {
        try {
            return text(await searchTemplates(query, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("popular_templates", "The most-used meme templates in the Imgflip catalogue.", { limit: z.number().int().min(1).max(50).default(15).describe("Templates to return") }, async ({ limit }) => {
        try {
            return text(await popularTemplates(limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("template_info", "Dimensions, caption-box count and usage for one template; lists the candidates when the name is ambiguous.", { template: z.string().min(2).describe("Template name or Imgflip id") }, async ({ template }) => {
        try {
            return text(await templateInfo(template));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("random_template", "One random template from the catalogue, with its blank image.", {}, async () => {
        try {
            return text(await randomTemplate());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_generators", "memegen generators that can render text onto an image, with line counts and styles.", {
        query: z.string().optional().describe("Optional name or id filter"),
        limit: z.number().int().min(1).max(50).default(20).describe("Generators to return"),
    }, async ({ query, limit }) => {
        try {
            return text(await listGenerators(query, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("generate_meme", "Render text onto a template and return the image URL (memegen, checked to be a real render).", {
        template: z.string().min(1).describe("Generator id or name, e.g. drake or buzz"),
        lines: z.array(z.string().min(1)).min(1).max(4).describe("Text lines, top to bottom"),
    }, async ({ template, lines }) => {
        try {
            return text(await generateMeme(template, lines));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}

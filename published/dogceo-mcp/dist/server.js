import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { breedImages, listBreeds, randomDogImage, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "dogceo-mcp", version: "1.0.0" });
    server.tool("random_dog_image", "One random dog photo, optionally from a specific breed or sub-breed.", {
        breed: z.string().optional().describe('Breed folder name, e.g. beagle'), subBreed: z.string().optional().describe('Sub-breed, e.g. kelpie (needs breed)')
    }, async (a) => {
        try {
            return text(await randomDogImage(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_breeds", "Every breed dog.ceo serves, with the sub-breeds each one has.", {
        limit: z.number().int().min(1).max(250).optional().describe('Breeds to show, default 25')
    }, async (a) => {
        try {
            return text(await listBreeds(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("breed_images", "All photos dog.ceo holds for one breed or sub-breed.", {
        breed: z.string().describe('Breed folder name, e.g. husky'), subBreed: z.string().optional().describe('Sub-breed folder name'), limit: z.number().int().min(1).max(50).optional().describe('Images to show, default 10')
    }, async (a) => {
        try {
            return text(await breedImages(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}

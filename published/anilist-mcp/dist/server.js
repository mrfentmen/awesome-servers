import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { characterDetails, mediaDetails, searchAnime, searchManga, seasonBrowse, staffDetails, studioDetails, userList } from './api.js';
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'anilist-mcp', version: '1.0.0' });
    server.registerTool('searchAnime', {
        title: "Search Anime",
        description: 'Search AniList anime.',
        inputSchema: z.object({ query: z.string().describe('Title search.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchAnime(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('searchManga', {
        title: "Search Manga",
        description: 'Search AniList manga.',
        inputSchema: z.object({ query: z.string().describe('Title search.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchManga(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('media_details', {
        title: "Media details",
        description: 'One anime or manga with studios and score.',
        inputSchema: z.object({ id: z.number().describe('AniList media ID.') }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mediaDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('season_browse', {
        title: "Season browse",
        description: 'Most popular anime of one season.',
        inputSchema: z.object({ season: z.string().describe('WINTER, SPRING, SUMMER or FALL.'), year: z.number().describe('Year.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await seasonBrowse(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('character_details', {
        title: "Character details",
        description: 'One character with appearances.',
        inputSchema: z.object({ id: z.number().describe('Character ID.') }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await characterDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('studio_details', {
        title: "Studio details",
        description: 'One studio with known works.',
        inputSchema: z.object({ id: z.number().describe('Studio ID.') }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await studioDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('staff_details', {
        title: "Staff details",
        description: 'One staff member (voice actor, director...).',
        inputSchema: z.object({ id: z.number().describe('Staff ID.') }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await staffDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('user_list', {
        title: "User list",
        description: 'Public anime/manga lists of a user.',
        inputSchema: z.object({ username: z.string().describe('AniList username.'), type: z.string().describe('ANIME or MANGA.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await userList(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}

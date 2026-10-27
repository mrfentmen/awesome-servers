#!/usr/bin/env node
/**
 * ifdb-mcp-server — Model Context Protocol server for the Interactive Fiction
 * Database (IFDB, https://ifdb.org).
 *
 * Exposes two tools:
 *   - search_games:      search IFDB by title/author/keyword, with optional sort
 *   - get_game_details:  full details for one game (description, ratings,
 *                        downloads, genres, play-online link, ...)
 *
 * IFDB has no public API and requires no API key, so this server reads the
 * public HTML pages and parses them with cheerio. Requests are sequential,
 * carry an identifying User-Agent, and are spaced out to be polite.
 */
export {};

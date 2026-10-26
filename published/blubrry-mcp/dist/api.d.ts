export declare class BlubrryError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listShows(): Promise<string>;
export declare function listShowMedia(keyword: string): Promise<string>;
export declare function getShowStatsSummary(keyword: string): Promise<string>;
export declare function getShowEpisodeStats(keyword: string): Promise<string>;
export declare function getShowStatsTotals(keyword: string): Promise<string>;
/**
 * GET /stats/index.json - "List shows with statistics access".
 * Body: array of Hosted{program_title, program_keyword, program_id,
 *                        podcast_id, stats_program_id, feed_url}
 */
export declare function listStatsShows(_args?: Record<string, never>): Promise<string>;
export interface CountriesArgs {
    keyword: string;
    limit?: string;
}
/**
 * GET /stats/{keyword}/countries.json
 * Body: { record_count, "<mcc>": { country_name, total }, ... }
 */
export declare function downloadCountries(keyword: string, limit?: string): Promise<string>;
export interface AppsArgs {
    keyword: string;
    limit?: string;
}
/**
 * GET /stats/{keyword}/apps.json   -> { record_count, "<client_class_id>": { client_name, client_class_id, total } }
 * GET /stats/{keyword}/app-types.json -> { record_count, "<class id>": { client_class_name, total } }
 * Grouped by class id because the two responses key on the same id.
 */
export declare function listeningApps(keyword: string, limit?: string): Promise<string>;

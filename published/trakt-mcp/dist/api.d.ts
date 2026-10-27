export declare class TraktError extends Error {
}
type Raw = Record<string, any>;
export interface Show {
    title?: string;
    year?: number;
    ids: Raw;
}
export declare function searchShows(query: string, limit?: number): Promise<Show[]>;
export declare function trendingShows(limit?: number): Promise<Show[]>;
export declare function trendingMovies(limit?: number): Promise<Show[]>;
export declare function imdbOf(ids: Raw): string;
export declare function formatShow(s: Show, imdb: string, index?: number): string;
interface Entry {
    title?: string;
    year?: number | string | null;
    ids?: Record<string, unknown> | null;
    [k: string]: unknown;
}
export interface MatchTitleArgs {
    query: string;
    candidates: Entry[];
    limit?: number;
}
export declare function match_title(args: MatchTitleArgs): string;
export interface DedupeArgs {
    entries: Entry[];
}
export declare function dedupe_entries(args: DedupeArgs): string;
export interface ShowIdsArgs {
    entry: Entry;
}
export declare function show_identifiers(args: ShowIdsArgs): string;
export {};

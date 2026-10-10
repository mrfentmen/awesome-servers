export declare class BraveError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function webSearch(query: string, count?: string): Promise<string>;
export declare function newsSearch(query: string, count?: string): Promise<string>;
export declare function imageSearch(query: string, count?: string): Promise<string>;
export declare function videoSearch(query: string, count?: string): Promise<string>;
export declare function suggestQueries(query: string): Promise<string>;
export declare function spellcheck(query: string): Promise<string>;
export declare function listGoggles(): Promise<string>;
export declare function faqSearch(query: string, count?: string): Promise<string>;
export declare function discussionSearch(query: string, count?: string): Promise<string>;
export declare function localizedSearch(query: string, country: string, count?: string): Promise<string>;
export interface FreshnessArgs {
    query: string;
    window?: string;
    count?: string;
}
/**
 * GET /web/search and GET /news/search with the documented `freshness` filter
 * (pd / pw / pm / py), plus extra_snippets and result_filter.
 */
export declare function freshnessSweep(args: FreshnessArgs): Promise<string>;
export interface GoggleArgs {
    query: string;
    goggles: string;
    count?: string;
}
/**
 * GET /web/search with the `goggles` parameter: a hosted Goggle URL, an inline
 * Goggle spec ($boost / $downrank / $discard with site= rules), or up to 3 of
 * them separated by newlines.
 */
export declare function goggleSearch(args: GoggleArgs): Promise<string>;
export interface DiveArgs {
    query: string;
    pages?: string;
    count?: string;
}
/**
 * GET /web/search walked through offset 0..pages, following the documented
 * `query.more_results_available` flag rather than paging blindly.
 */
export declare function pagedDive(args: DiveArgs): Promise<string>;

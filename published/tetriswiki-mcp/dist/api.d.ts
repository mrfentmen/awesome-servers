export declare class TetrisError extends Error {
}
export interface WikiPage {
    pageid: number;
    title: string;
    snippet?: string;
}
export declare function searchPages(query: string, limit?: number): Promise<WikiPage[]>;
export declare function getPage(title: string, maxChars?: number): Promise<{
    title: string;
    wikitext: string;
    url: string;
} | null>;
export declare function wikiTextToPlain(wt: string, maxChars?: number): string;
export interface PageHistoryArgs {
    title: string;
    limit?: number;
}
export interface BrowseCategoryArgs {
    category: string;
    limit?: number;
}
export interface RecentChangesArgs {
    limit?: number;
}
export interface OutlinksArgs {
    title: string;
    limit?: number;
}

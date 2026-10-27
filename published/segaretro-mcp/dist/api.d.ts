export declare class SegaError extends Error {
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
export declare function categoryMembers(category: string, limit?: number): Promise<string[]>;
export declare function wikiTextToPlain(wt: string, maxChars?: number): string;
export interface RecentChangesArgs {
    limit?: number;
}
export declare function recentChanges(args: RecentChangesArgs): Promise<string>;
export interface PageMetadataArgs {
    title: string;
    categoryLimit?: number;
}
export declare function pageMetadata(args: PageMetadataArgs): Promise<string>;

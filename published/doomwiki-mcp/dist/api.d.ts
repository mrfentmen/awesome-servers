export declare class DoomWikiError extends Error {
}
export interface PageHit {
    title: string;
    pageid?: number;
}
export declare function searchPages(query: string, limit?: number): Promise<PageHit[]>;
export declare function getPage(title: string): Promise<string>;
export declare function categoryMembers(category: string, limit?: number): Promise<PageHit[]>;
/** Strip templates, links, refs from raw wikitext so it reads like prose. */
export declare function cleanWikiText(wt: string, maxChars?: number): string;

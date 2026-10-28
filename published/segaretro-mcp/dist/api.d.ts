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

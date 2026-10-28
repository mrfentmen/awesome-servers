export declare class WikiError extends Error {
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
/** Crude wikitext → readable text (links, bold, tables, refs). */
export declare function wikiTextToPlain(wt: string, maxChars?: number): string;

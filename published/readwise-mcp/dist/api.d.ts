export declare class ReadwiseError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function auth(): Promise<string>;
export declare function listBooks(): Promise<string>;
export declare function listHighlights(): Promise<string>;
/**
 * The published literature behind a topic, ranked by how much it has actually
 * been cited, with the venue, the DOI and the reference count. This is the
 * search a reader wants before deciding what to highlight.
 */
export declare function paperSearch(args: {
    query: string;
    limit?: number;
    fromYear?: number;
}): Promise<string>;
/**
 * One paper's reference list and how far it has been cited, which is the part of
 * a paper a reader reads to decide whether the citation is load-bearing.
 */
export declare function paperReferences(args: {
    doi: string;
    limit?: number;
}): Promise<string>;

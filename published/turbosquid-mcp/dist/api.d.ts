export declare class TurboSquidError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listFileFormats(): Promise<string>;
export declare function getProduct(productId: string): Promise<string>;
export declare function listDrafts(): Promise<string>;
export declare function getDraft(draftId: string): Promise<string>;
/**
 * Freely reusable models on a given subject, with the real file inventory of each
 * hit: which formats it ships in, how big those files are, and whether a preview
 * exists. Useful when a marketplace search returns only paid assets.
 */
export declare function freeModelSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;

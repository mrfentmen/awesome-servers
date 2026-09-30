export declare class EcccError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listCollections(): Promise<string>;
export declare function getCollection(collectionId: string): Promise<string>;
export declare function queryCollection(collectionId: string, bbox?: string, limit?: number): Promise<string>;
/** Tally what a point-based collection holds inside a box, instead of listing every row. */
export declare function inventorySummary(args: {
    collectionId?: string;
    bbox?: string;
    limit?: number;
}): Promise<string>;
export interface ItemArgs {
    collectionId?: string;
    itemId?: string;
}

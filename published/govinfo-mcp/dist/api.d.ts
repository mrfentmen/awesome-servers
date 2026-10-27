export declare class GovInfoError extends Error {
}
export interface Collection {
    code: string;
    name?: string;
}
export declare function listCollections(): Promise<Collection[]>;
export interface PubHit {
    id?: string;
    title?: string;
    date?: string;
    collection?: string;
}
export declare function searchPublished(query: string, collection?: string, limit?: number): Promise<PubHit[]>;
export declare function formatHit(h: PubHit, index?: number): string;
export declare function collectionStatistics(args: {
    query?: string;
    limit?: number;
}): Promise<string>;

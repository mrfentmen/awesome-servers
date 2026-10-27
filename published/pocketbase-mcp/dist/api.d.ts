export declare class PocketBaseError extends Error {
}
type Raw = Record<string, any>;
export declare function health(): Promise<string>;
export interface CollectionInfo {
    id: string;
    name: string;
    type?: string;
}
export declare function listCollections(): Promise<CollectionInfo[]>;
export declare function listRecords(collection: string, filter?: string, limit?: number): Promise<Raw[]>;
export declare function createRecord(collection: string, data: Raw): Promise<Raw>;
export declare function formatRecord(r: Raw, index?: number): string;
export {};

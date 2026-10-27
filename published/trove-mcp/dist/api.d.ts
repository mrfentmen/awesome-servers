export declare class TroveError extends Error {
}
export interface TroveRecord {
    id?: string;
    title?: string;
    category?: string;
    date?: string;
    snippet?: string;
}
export declare function searchRecords(query: string, category?: string, limit?: number): Promise<TroveRecord[]>;
export declare function formatRecord(r: TroveRecord, index?: number): string;
export declare function catalogueSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function authorSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;

export declare class CernError extends Error {
}
export interface CernRecord {
    id?: number;
    title?: string;
    type?: string;
    experiment?: string;
    year?: number;
}
export declare function searchRecords(query: string, rtype?: string, limit?: number): Promise<CernRecord[]>;
export declare function getRecord(id: string): Promise<string>;
export declare function formatRecord(r: CernRecord, index?: number): string;

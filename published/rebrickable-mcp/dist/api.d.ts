export declare class RebrickableError extends Error {
}
export interface LegoSet {
    number: string;
    name?: string;
    year?: number;
    parts?: number;
    image?: string;
}
export declare function searchSets(query: string, limit?: number): Promise<LegoSet[]>;
export declare function getSet(number: string): Promise<string>;
export declare function setParts(number: string, limit?: number): Promise<string[]>;
export declare function formatSet(s: LegoSet, index?: number): string;
export declare class RebrickableDataError extends Error {
}
/** The colour table Rebrickable publishes: how common each colour is, its hex, and when it was in use. */
export declare function colorRoster(args: {
    minSets?: number;
    transparent?: boolean;
    limit?: number;
}): Promise<string>;

export declare class SurrealDbError extends Error {
}
type Raw = Record<string, any>;
export declare function serverVersion(): Promise<string>;
export declare function runQuery(sql: string): Promise<Raw[]>;
export declare function formatResult(rows: Raw[]): string;
/**
 * Read a SurrealQL statement without running it: what it touches, whether it is
 * safe to run against a live database, and which of the usual footguns it walks into.
 */
export declare function surrealqlReview(args: {
    query?: string;
}): Promise<string>;
/** The published SurrealDB crate: how fast it moves, what it depends on and how it is licensed. */
export declare function crateVersionMatrix(args: {
    crate?: string;
    limit?: number;
}): Promise<string>;
/** The upstream release train, with notes, against the published crate. */
export declare function releaseFeed(args: {
    limit?: number;
}): Promise<string>;
export {};

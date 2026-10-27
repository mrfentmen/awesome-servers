export declare class MilvusError extends Error {
}
type Raw = Record<string, any>;
export declare function listCollections(): Promise<string[]>;
export declare function describeCollection(name: string): Promise<Raw>;
export declare function collectionStats(name: string): Promise<Raw>;
export declare function formatDescribe(name: string, d: Raw): string;
export declare function formatStats(name: string, d: Raw): string;
/**
 * What a vector collection will cost to hold, worked out from the schema and
 * index parameters rather than read back from a running server.
 */
export declare function vectorFootprint(args: {
    dimension?: number;
    rows?: number;
    dataType?: string;
    indexType?: string;
    m?: number;
    nlist?: number;
    subVectors?: number;
    bitsPerCode?: number;
    primaryKeyBytes?: number;
}): Promise<string>;
/** Per-query work for an approximate index, derived from its own parameters. */
export declare function searchCost(args: {
    indexType?: string;
    numVectors?: number;
    dimension?: number;
    nlist?: number;
    nprobe?: number;
    m?: number;
    efConstruction?: number;
    efSearch?: number;
    dataType?: string;
}): Promise<string>;
/** Score real candidate vectors against a query under a chosen metric, so the metric can be compared on real numbers. */
export declare function metricProbe(args: {
    metric?: string;
    query?: unknown;
    candidates?: unknown;
    limit?: number;
}): Promise<string>;
export {};

export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function genomeDatasets(a: {
    taxon: string;
    limit?: number;
}): Promise<string>;
export declare function geneDatasets(a: {
    symbol: string;
    taxon?: string;
    limit?: number;
}): Promise<string>;
export declare function taxonomyLookup(a: {
    taxon: string;
}): Promise<string>;

export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function searchTerms(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function findPathways(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function searchProteins(a: {
    query: string;
    limit?: number;
}): Promise<string>;

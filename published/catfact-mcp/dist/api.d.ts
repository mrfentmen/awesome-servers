export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function randomCatFact(): Promise<string>;
export declare function catBreeds(a: {
    limit?: number;
    page?: number;
}): Promise<string>;
export declare function listFacts(a: {
    limit?: number;
    page?: number;
}): Promise<string>;

export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function searchCharacters(a: {
    name: string;
    limit?: number;
}): Promise<string>;
export declare function characterDetail(a: {
    slug: string;
}): Promise<string>;
export declare function searchSpells(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function listBooks(a: {
    limit?: number;
}): Promise<string>;

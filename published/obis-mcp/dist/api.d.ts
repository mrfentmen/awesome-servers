export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function taxonInfo(a: {
    name: string;
}): Promise<string>;
export declare function taxonChildren(a: {
    taxonId: number;
}): Promise<string>;
export declare function occurrences(a: {
    taxonId?: number;
    scientificName?: string;
    limit?: number;
}): Promise<string>;

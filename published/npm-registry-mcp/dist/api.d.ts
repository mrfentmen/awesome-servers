export declare class SourceError extends Error {
}
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function packageInfo(a: {
    name: string;
}): Promise<string>;
export declare function searchPackages(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function packageVersions(a: {
    name: string;
    limit?: number;
}): Promise<string>;

export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function queryJsonpath(a: {
    json: string;
    path: string;
}): Promise<string>;
export declare function listJsonPaths(a: {
    json: string;
    maxDepth: number;
}): Promise<string>;
export declare function countJsonpath(a: {
    json: string;
    path: string;
}): Promise<string>;

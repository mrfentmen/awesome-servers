export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function hashText(a: {
    text: string;
    algorithm?: string;
}): Promise<string>;
export declare function hashAll(a: {
    text: string;
}): Promise<string>;
export declare function hmacText(a: {
    text: string;
    key: string;
    algorithm?: string;
}): Promise<string>;

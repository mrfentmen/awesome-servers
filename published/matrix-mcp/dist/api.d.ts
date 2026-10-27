export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
type M = number[][];
export declare function matrixMultiply(a: {
    a: M;
    b: M;
}): Promise<string>;
export declare function matrixDeterminant(a: {
    matrix: M;
}): Promise<string>;
export declare function matrixInverse(a: {
    matrix: M;
}): Promise<string>;
export {};

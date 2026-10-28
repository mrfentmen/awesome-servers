/**
 * Combinatorics — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function factorialOf(a: {
    n: number;
}): Promise<string>;
export declare function chooseNumbers(a: {
    n: number;
    r: number;
    kind?: string;
}): Promise<string>;
export declare function fibonacciOf(a: {
    n: number;
}): Promise<string>;
export declare function permutationsOf(a: {
    items: string;
    limit?: number;
}): Promise<string>;
export declare function combinationsOf(a: {
    items: string;
    choose: number;
    limit?: number;
}): Promise<string>;

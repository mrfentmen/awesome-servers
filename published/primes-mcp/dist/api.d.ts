/**
 * Primes — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function isPrime(a: {
    n: string;
}): Promise<string>;
export declare function factorise(a: {
    n: string;
}): Promise<string>;
export declare function primesInRange(a: {
    from: number;
    to: number;
    limit?: number;
}): Promise<string>;
export declare function nextPrime(a: {
    n: string;
}): Promise<string>;

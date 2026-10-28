/**
 * IEEE-754 Floats — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function floatInfo(a: {
    value: string;
}): Promise<string>;
export declare function bitsToFloat(a: {
    bits: string;
    width?: number;
}): Promise<string>;
export declare function nextFloat(a: {
    value: string;
    steps?: number;
}): Promise<string>;

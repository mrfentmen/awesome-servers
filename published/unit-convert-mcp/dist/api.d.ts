/**
 * Unit Converter — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function convert(a: {
    value: number;
    from: string;
    to: string;
}): Promise<string>;
export declare function listUnits(a: {
    category?: string;
}): Promise<string>;

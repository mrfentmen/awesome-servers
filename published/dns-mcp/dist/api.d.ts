/**
 * DNS Lookup — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function resolveHost(a: {
    name: string;
    type?: string;
}): Promise<string>;
export declare function reverseLookup(a: {
    ip: string;
}): Promise<string>;
export declare function emailDeliverability(a: {
    domain: string;
}): Promise<string>;

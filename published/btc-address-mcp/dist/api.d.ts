/**
 * Bitcoin Addresses — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function validateBtcAddress(a: {
    address: string;
}): Promise<string>;
export declare function derivationPathInfo(a: {
    path: string;
}): Promise<string>;
export declare function listAddressTypes(): Promise<string>;

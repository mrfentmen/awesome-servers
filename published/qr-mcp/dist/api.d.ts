/**
 * QR Codes — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function qrMatrix(a: {
    text: string;
    ecl?: string;
    version?: number;
    mask?: number;
}): Promise<string>;
export declare function qrAscii(a: {
    text: string;
    ecl?: string;
    version?: number;
    invert?: boolean;
}): Promise<string>;
export declare function qrSvg(a: {
    text: string;
    ecl?: string;
    version?: number;
    scale?: number;
    margin?: number;
}): Promise<string>;

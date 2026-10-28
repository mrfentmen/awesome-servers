/**
 * JSON with Comments — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function parseJsonc(a: {
    text: string;
    trailingCommas?: boolean;
}): Promise<string>;
export declare function stripJsonc(a: {
    text: string;
    trailingCommas?: boolean;
}): Promise<string>;
export declare function validateJsonc(a: {
    text: string;
}): Promise<string>;

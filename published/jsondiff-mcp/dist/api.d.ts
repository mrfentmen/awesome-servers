/**
 * JSON Diff & Patch — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function diffJson(a: {
    left: string;
    right: string;
}): Promise<string>;
export declare function applyJsonPatch(a: {
    target: string;
    patch: string;
}): Promise<string>;
export declare function canonicalJson(a: {
    text: string;
    sortKeys?: boolean;
    indent?: number;
}): Promise<string>;

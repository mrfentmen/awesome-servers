/**
 * Unified Patch — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function makePatch(a: {
    before: string;
    after: string;
    context?: number;
    oldPath?: string;
    newPath?: string;
}): Promise<string>;
export declare function applyPatch(a: {
    text: string;
    patch: string;
    reverse?: boolean;
}): Promise<string>;
export declare function checkPatch(a: {
    text: string;
    patch: string;
}): Promise<string>;

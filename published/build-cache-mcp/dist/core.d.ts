export declare class BuildCacheError extends Error {
}
export declare function inspectBuildCache(input: {
    project: string;
}): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
export declare function artifactBreakdown(input: {
    project: string;
}): Promise<string>;
export declare function reclaimableCache(input: {
    project: string;
}): Promise<string>;

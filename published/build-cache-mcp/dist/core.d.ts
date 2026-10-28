export declare class BuildCacheError extends Error {
}
export declare function inspectBuildCache(input: {
    project: string;
}): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

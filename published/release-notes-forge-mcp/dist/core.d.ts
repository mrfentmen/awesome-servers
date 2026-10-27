export declare class ReleaseError extends Error {
}
export declare function summarizeReleaseHistory(input: {
    cwd: string;
    limit?: number;
}): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

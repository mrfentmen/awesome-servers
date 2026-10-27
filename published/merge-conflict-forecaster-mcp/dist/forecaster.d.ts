export declare class ForecasterError extends Error {
}
export declare function parseBranchRows(output: string): Array<{
    name: string;
    upstream: string;
    ahead: number;
    behind: number;
}>;
export declare function parseNameStatus(output: string): string[];
export declare function forecast(input: {
    cwd: string;
    base?: string;
    limit?: number;
}): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

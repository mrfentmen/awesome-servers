export declare class SecretHygieneError extends Error {
}
export declare function scanSecretHygiene(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    bytesScanned: number;
    patternBuckets: Record<string, number>;
    totalMatchCount: number;
    risk: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;

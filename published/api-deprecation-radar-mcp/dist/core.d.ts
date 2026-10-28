export declare class DeprecationError extends Error {
}
export declare function inspectDeprecationRadar(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    markerCount: number;
    severityBuckets: Record<string, number>;
    reviewSignal: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;

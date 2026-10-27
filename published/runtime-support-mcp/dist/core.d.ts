export declare class RuntimeSupportError extends Error {
}
export declare function inspectRuntimeSupport(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    signalCount: number;
    runtimeFamilySignals: Record<string, number>;
    diversity: number;
    reviewSignal: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;

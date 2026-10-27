export declare class GaugeError extends Error {
}
export declare function inspect(input: string): Promise<Record<string, unknown>>;
export declare function manifest(input: string, relativeFile: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;
export declare function directoryWeights(input: string): Promise<Record<string, unknown>>;
export declare function sizeBudget(input: string, budgetBytes: number): Promise<Record<string, unknown>>;
export declare function artifactHints(input: string): Promise<Record<string, unknown>>;

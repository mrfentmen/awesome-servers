export declare class DriftError extends Error {
}
export declare function inspectDependencyDrift(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

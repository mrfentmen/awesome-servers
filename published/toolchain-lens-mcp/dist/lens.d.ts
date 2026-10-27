export declare class LensError extends Error {
}
export declare function explain(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

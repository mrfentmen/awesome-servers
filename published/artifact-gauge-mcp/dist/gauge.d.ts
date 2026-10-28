export declare class GaugeError extends Error {
}
export declare function inspect(input: string): Promise<Record<string, unknown>>;
export declare function manifest(input: string, relativeFile: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

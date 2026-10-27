export declare class ArchaeologyError extends Error {
}
export declare function reflogSignals(input: string): Promise<Record<string, unknown>>;
export declare function recoverySignals(input: string): Promise<Record<string, unknown>>;
export declare function stashSignals(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

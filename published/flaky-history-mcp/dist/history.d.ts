export declare class HistoryError extends Error {
}
export declare function analyzeHistory(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

export declare class EvidenceError extends Error {
}
export declare function explainEvidence(input: string): Promise<Record<string, unknown>>;
export declare function format(value: unknown): string;

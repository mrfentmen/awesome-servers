export declare class OeisError extends Error {
}
export interface Sequence {
    number: number;
    id: string;
    data?: string;
    name?: string;
    comment?: string[];
    formula?: string[];
    keyword?: string;
    offset?: string;
    author?: string;
    xrefs?: string;
}
export declare function searchSequences(query: string, limit?: number): Promise<Sequence[]>;
export declare function getSequence(id: string): Promise<Sequence | null>;
export declare function aNumber(s: Sequence): string;
export declare function formatSequence(s: Sequence, index?: number): string;

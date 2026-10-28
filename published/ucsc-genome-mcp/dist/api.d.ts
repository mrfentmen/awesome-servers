export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function listGenomes(a: {
    query?: string;
    limit?: number;
}): Promise<string>;
export declare function listChromosomes(a: {
    genome: string;
    limit?: number;
}): Promise<string>;
export declare function getSequence(a: {
    genome: string;
    chrom: string;
    start: number;
    end: number;
}): Promise<string>;
export declare function searchGenome(a: {
    term: string;
    genome: string;
    limit?: number;
}): Promise<string>;

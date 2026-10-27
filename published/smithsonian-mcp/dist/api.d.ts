export declare class SmithsonianError extends Error {
}
export interface SiObject {
    id?: string;
    title?: string;
    type?: string;
    date?: string;
    image?: string;
}
export declare function searchObjects(query: string, limit?: number): Promise<SiObject[]>;
export declare function formatObject(o: SiObject, index?: number): string;
export interface OpenAccessCorpusArgs {
    unit?: string;
}
export declare function openAccessCorpus(args: OpenAccessCorpusArgs): Promise<string>;
export interface OpenAccessDigestArgs {
    unit: string;
    maxShards?: number;
    maxBytes?: number;
}
export declare function openAccessDigest(args: OpenAccessDigestArgs): Promise<string>;

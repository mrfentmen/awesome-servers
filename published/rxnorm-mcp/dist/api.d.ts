export declare class RxNavError extends Error {
}
export interface Concept {
    rxcui?: string;
    name?: string;
    synonym?: string;
    tty?: string;
    language?: string;
}
export declare function drugs(name: string): Promise<Concept[]>;
export declare function normalize(name: string): Promise<string[]>;
export declare function properties(rxcui: string): Promise<Concept | undefined>;
export declare function ndcs(rxcui: string): Promise<string[]>;
export declare function related(rxcui: string): Promise<Concept[]>;
export declare function spellings(name: string): Promise<string[]>;
export declare function conceptLine(c: Concept): string;

export declare class DatamuseError extends Error {
}
export interface WordHit {
    word: string;
    score?: number;
    numSyllables?: number;
    defs?: string[];
    tags?: string[];
}
export declare function rhymesWith(word: string, limit?: number): Promise<WordHit[]>;
export declare function meansLike(word: string, limit?: number): Promise<WordHit[]>;
export declare function relatedTo(word: string, limit?: number): Promise<WordHit[]>;
export declare function spellCheck(word: string): Promise<WordHit[]>;
export declare function suggest(prefix: string, limit?: number): Promise<WordHit[]>;
export declare function formatHits(hits: WordHit[]): string;
export declare function formatWithDefs(hits: WordHit[]): string;

/**
 * Jisho.org API v1 client — Japanese-English dictionary.
 * Docs: https://jisho.org/forum/54fefc1f6e71740b1f000000 (unofficial)
 * Endpoints: /api/v1/search/words?keyword=... and /api/v1/search/sentences?keyword=...
 */
export declare class JishoError extends Error {
}
export interface WordResult {
    slug: string;
    isCommon: boolean;
    jlpt: string[];
    tags: string[];
    japanese: {
        word?: string;
        reading?: string;
    }[];
    senses: {
        englishDefinitions: string[];
        partsOfSpeech: string[];
        tags: string[];
        seeAlso: string[];
    }[];
}
export declare function searchWords(keyword: string, limit?: number): Promise<WordResult[]>;
/**
 * Tag/feature searches the words endpoint supports: "#common", "jlpt-n5",
 * "wanikani10", English meanings, etc.
 */
export declare function searchByTag(keyword: string, limit?: number): Promise<WordResult[]>;
export declare function formatWord(w: WordResult, index?: number): string;

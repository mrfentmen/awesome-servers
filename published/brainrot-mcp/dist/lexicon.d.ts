/**
 * Curated internet-slang lexicon — fully offline, zero network calls.
 * Covers the classic brainrot vocabulary plus the underground rap /
 * SoundCloud scene (Nettspend, Xavier Wulf-era rage, Osamason, etc.)
 * and TikTok-era meme language.
 */
export interface SlangEntry {
    term: string;
    meaning: string;
    origin: string;
    example: string;
    vibe: string;
}
export declare const LEXICON: SlangEntry[];
export declare function lookupExact(term: string): SlangEntry | undefined;
export declare function searchLexicon(query: string): SlangEntry[];
/** Find every known term present in a blob of text. */
export declare function findInText(text: string): SlangEntry[];

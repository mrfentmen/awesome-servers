/**
 * OpenMoji client, keyless.
 * The whole emoji dataset is one public JSON file, cached in memory per process.
 */
export declare class OpenmojiError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export interface Emoji {
    hexcode: string;
    emoji: string;
    annotation: string;
    group: string;
    subgroups: string;
    tags: string;
    order?: number;
}
export declare function emojiCount(): Promise<number>;
export declare function searchEmoji(query: string, limit: number): Promise<string>;
export declare function getEmoji(hexcode: string): Promise<string>;
export declare function listGroups(): Promise<string>;
export declare function listSubgroups(group: string): Promise<string>;
export declare function emojisInGroup(group: string, subgroup: string | undefined, limit: number): Promise<string>;
export declare function randomEmoji(group: string | undefined): Promise<string>;
export declare function emojiStats(): Promise<string>;
export interface Emoji {
    skintone?: number | string;
    skintone_base_hexcode?: string;
    skintone_combination?: string;
    openmoji_tags?: string;
    openmoji_author?: string;
    openmoji_date?: string;
    unicode?: number;
}
/**
 * The two SVG files OpenMoji publishes for one emoji, checked before they are
 * handed over, because a designer pasting a URL wants it to work.
 */
export declare function svgLinks(args: {
    hexcode: string;
}): Promise<string>;
/**
 * The skin-tone run of one emoji, taken from the dataset's own base-hexcode
 * links rather than guessed from the code points.
 */
export declare function skinToneVariants(args: {
    emoji: string;
}): Promise<string>;
/** Two emoji compared on the metadata that decides whether they are interchangeable. */
export declare function compareEmoji(args: {
    a: string;
    b: string;
}): Promise<string>;
/** Check a string of text for the emoji mistakes that actually break rendering, locally. */
export declare function emojiLint(args: {
    input?: string;
}): Promise<string>;

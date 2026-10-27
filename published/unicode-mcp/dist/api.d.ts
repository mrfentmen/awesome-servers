export declare class UnicodeError extends Error {
}
export declare function character(value: string): Promise<{
    codePoint: string;
    name: string;
    category: string;
    combiningClass: string;
    bidiClass: string;
    decomposition: string | null;
    decimal: string | null;
    digit: string | null;
    numeric: string | null;
    mirrored: string;
    range?: undefined;
} | {
    codePoint: string;
    name: string;
    category: string;
    combiningClass: string;
    bidiClass: string;
    range: boolean;
    decomposition?: undefined;
    decimal?: undefined;
    digit?: undefined;
    numeric?: undefined;
    mirrored?: undefined;
} | null>;
export declare function searchBlocks(query: string): Promise<string[]>;
export declare function emojiSearch(query: string): Promise<string[]>;
export declare function format(value: unknown): string;

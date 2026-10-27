export declare class XkcdError extends Error {
}
export interface Comic {
    num?: number;
    title?: string;
    safe_title?: string;
    alt?: string;
    img?: string;
    day?: string;
    month?: string;
    year?: string;
    transcript?: string;
    news?: string;
}
export declare function latestComic(): Promise<Comic>;
export declare function getComic(num: number): Promise<Comic>;
export declare function formatComic(c: Comic): string;
export interface RangeArgs {
    from: number;
    to?: number;
    limit?: number;
}
export declare function comic_range(args: RangeArgs): Promise<string>;
export interface FindArgs {
    from: number;
    term: string;
    to?: number;
    limit?: number;
}
export interface CensusArgs {
    from: number;
    to?: number;
}
export interface TranscriptArgs {
    numbers: number[];
    maxChars?: number;
}

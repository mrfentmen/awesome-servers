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

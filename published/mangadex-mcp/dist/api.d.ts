/**
 * MangaDex API v5 client (public, no auth).
 * Docs: https://api.mangadex.org/docs/
 * Be polite: default rate limits apply (5 req/s per IP).
 */
export declare class MangaDexError extends Error {
}
export interface TagAttr {
    name: Record<string, string>;
    group: string;
}
export interface Manga {
    id: string;
    title: string;
    altTitles: string[];
    year?: number | null;
    status?: string | null;
    description?: string;
    tags: string[];
    authors: string[];
    rating?: number;
    followers?: number;
}
export interface Chapter {
    id: string;
    title?: string;
    chapter?: string | null;
    volume?: string | null;
    lang: string;
    pages: number;
    publishedAt?: string;
    groupNames: string[];
    externalUrl?: string | null;
}
export interface Author {
    id: string;
    name: string;
    biography?: string;
    twitter?: string;
    website?: string;
}
export declare function searchManga(title: string, limit?: number, lang?: string): Promise<Manga[]>;
export declare function getManga(id: string): Promise<Manga | null>;
export declare function getChapters(mangaId: string, lang?: string, limit?: number, ascending?: boolean): Promise<Chapter[]>;
export declare function searchAuthor(name: string, limit?: number): Promise<Author[]>;
export declare function getTags(): Promise<{
    name: string;
    group: string;
}[]>;
export declare function formatManga(m: Manga): string;
export declare function formatChapter(c: Chapter): string;
export interface MangaByTagArgs {
    tag: string;
    limit?: number;
}

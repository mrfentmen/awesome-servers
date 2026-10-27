/**
 * VNDB API v2 client.
 * Docs: https://api.vndb.org/kana
 * POST JSON to https://api.vndb.org/kana/<collection> — the collection
 * (vn / character / release / ...) is part of the URL path. A
 * descriptive User-Agent is required. Public API — no auth needed.
 */
export declare class VndbApiError extends Error {
}
export interface VN {
    id: string;
    title?: string;
    alttitle?: string | null;
    titles?: {
        lang: string;
        title: string;
        latin?: string | null;
    }[];
    released?: string | null;
    rating?: number;
    votecount?: number;
    popularity?: number;
    length?: number | null;
    devstatus?: number;
    description?: string | null;
    image?: {
        url?: string;
    } | null;
    developers?: {
        id?: string;
        name?: string;
    }[];
    tags?: {
        id?: string;
        name?: string;
    }[];
    platforms?: string[];
}
export interface Character {
    id: string;
    name?: string;
    original?: string | null;
    gender?: string[];
    birthday?: number[];
    height?: number | null;
    description?: string | null;
    traits?: {
        id?: string;
        name?: string;
    }[];
    vns?: {
        id?: string;
        title?: string;
    }[];
}
export interface Release {
    id: string;
    title?: string;
    released?: string | null;
    catalog?: string | null;
    languages?: {
        lang?: string;
        title?: string;
    }[];
    platforms?: string[];
    media?: {
        medium?: string;
        qty?: number;
    }[];
    vns?: {
        id?: string;
        title?: string;
    }[];
    producers?: {
        id?: string;
        name?: string;
    }[];
}
export declare function searchVns(query: string, results?: number, sort?: "rating" | "popularity" | "released" | "title"): Promise<VN[]>;
export declare function getVn(id: string): Promise<VN | null>;
export declare function searchCharacters(query: string, results?: number): Promise<Character[]>;
export declare function getReleases(vnId: string): Promise<Release[]>;
export declare function formatVn(v: VN): string;
export declare function formatCharacter(c: Character): string;
export declare function formatRelease(r: Release): string;

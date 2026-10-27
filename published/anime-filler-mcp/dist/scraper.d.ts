/**
 * animefillerlist.com scraper.
 *
 * The site tracks which anime episodes are manga canon, mixed
 * canon/filler, anime canon, or pure filler. No official API, so this
 * is a polite HTML scraper.
 *
 * Show pages contain an episode table — one <tr id="eps-N"> per episode
 * with a Number cell, a Title cell, and a Type cell (Manga Canon,
 * Mixed Canon/Filler, Anime Canon, Filler...). We parse that table.
 */
export declare class ScrapeError extends Error {
}
export interface AnimeResult {
    title: string;
    slug: string;
    url: string;
}
export interface Episode {
    number: number;
    title: string;
    category: string;
    date?: string;
}
export interface EpisodeCategory {
    label: string;
    episodes: number[];
}
export interface ShowInfo {
    title: string;
    slug: string;
    url: string;
    totalEpisodes?: number;
    status?: string;
    categories: EpisodeCategory[];
    episodes: Episode[];
}
export declare function searchAnime(query: string): Promise<AnimeResult[]>;
export declare function getShow(slug: string): Promise<ShowInfo>;
export declare function verdict(info: ShowInfo, episode: number): string;
export declare function fillerRunAnalysis(args: {
    slug?: string;
}): Promise<string>;
export declare function fillerEpisodeList(args: {
    slug?: string;
    limit?: number;
}): Promise<string>;

/**
 * GameFAQs scraper (no official API — this is a polite HTML scraper).
 *
 * GameFAQs is a Fandom-owned site with a huge archive of walkthroughs,
 * FAQs, and cheat codes going back 25+ years. We fetch the same pages a
 * browser would, with a real UA, and parse with cheerio.
 */
export declare class ScrapeError extends Error {
}
export interface GameResult {
    title: string;
    platform: string;
    url: string;
    year?: string;
}
export interface Guide {
    title: string;
    url: string;
    type: string;
    date?: string;
    author?: string;
}
export interface GamePage {
    title: string;
    platform: string;
    guides: Guide[];
}
/** Search GameFAQs for games by title. */
export declare function searchGames(query: string): Promise<GameResult[]>;
/** Fetch a game's page and extract its walkthrough/FAQ/cheat sections. */
export declare function getGamePage(gameUrl: string): Promise<GamePage>;
/** Fetch a guide/FAQ page and return its readable text content. */
export declare function getGuideContent(guideUrl: string): Promise<string>;

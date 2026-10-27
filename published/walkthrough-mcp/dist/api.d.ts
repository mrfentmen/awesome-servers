/**
 * StrategyWiki API client (open MediaWiki instance).
 * Docs: https://www.mediawiki.org/wiki/API
 * StrategyWiki hosts collaborative walkthroughs, FAQs, and cheat codes
 * for thousands of games — the GameFAQs niche, but with an open API.
 * (GameFAQs itself blocks all non-browser clients with a bot wall, so
 * we source the same kind of content here instead.)
 *
 * Be polite: MediaWiki asks for 1 req/s from scripts.
 *
 * Transport note: the site returns 403 to Node's native fetch (TLS
 * fingerprinting), so we shell out to curl, which it accepts.
 */
export declare class WikiError extends Error {
}
export interface SearchResult {
    title: string;
    pageId: number;
    url: string;
    snippet: string;
}
export declare function searchPages(query: string, limit?: number): Promise<SearchResult[]>;
/** List the subpages of a game page (e.g. "…/Walkthrough", "…/Cheats"). */
export declare function getSubpages(title: string): Promise<SearchResult[]>;
/** Fetch the wikitext of a page, lightly cleaned for LLM consumption. */
export declare function getPageWikitext(title: string): Promise<string>;

export declare class RadarrError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listMovies(): Promise<string>;
export declare function getQueue(): Promise<string>;
export declare function getHealth(): Promise<string>;
/**
 * The structured facts about a film from Wikidata, which is what a library has
 * to agree on before it will accept a file: release date, runtime, director,
 * cast, studio, country and the IMDb and TMDB identifiers.
 */
export declare function filmFacts(args: {
    title: string;
    year?: string;
}): Promise<string>;
/**
 * A director's credits as Wikidata has them, every titled work with its earliest
 * release date and IMDb identifier. Wikidata stores "director" on the film, so
 * this is a real query over the graph rather than a lookup on the person item.
 */
export declare function filmography(args: {
    name: string;
    limit?: number;
}): Promise<string>;

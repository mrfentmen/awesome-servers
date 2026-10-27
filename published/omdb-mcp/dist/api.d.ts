export declare class OmdbError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchMovies(query: string, page?: string): Promise<string>;
export declare function getMovie(idOrTitle: string): Promise<string>;
/** Which film did you mean? Wikidata candidates for a title, each with its IMDb id. */
export declare function findFilmIds(args: {
    title?: string;
    limit?: number;
}): Promise<string>;

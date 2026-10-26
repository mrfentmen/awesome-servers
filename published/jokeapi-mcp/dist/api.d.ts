/**
 * JokeAPI client, keyless.
 * Safe mode is always on so nothing offensive can come back.
 */
export declare class JokeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export interface Joke {
    error?: boolean;
    category?: string;
    type?: string;
    joke?: string;
    setup?: string;
    delivery?: string;
    flags?: Record<string, boolean>;
    id?: number;
    lang?: string;
}
export interface JokeEnvelope {
    error: boolean;
    amount?: number;
    jokes?: Joke[];
    message?: string;
    code?: number;
}
export declare function listCategories(): Promise<string>;
export declare function formatJoke(j: Joke, index?: number): string;
export declare function getJoke(category: string | undefined, amount: number): Promise<string>;
export declare function searchJokes(contains: string, category: string | undefined, amount: number): Promise<string>;
export declare function jokeById(id: string, category: string | undefined): Promise<string>;
export declare function jokeInfo(): Promise<string>;
export declare function listLanguages(): Promise<string>;
export declare function jokesByType(args: {
    type?: string;
    category?: string;
    amount?: number;
}): Promise<string>;
export declare function jokeRange(args: {
    from: string;
    to: string;
    category?: string;
    amount?: number;
}): Promise<string>;
/** How long the jokes actually are, measured rather than guessed, with the setup and delivery split. */
export declare function jokeLengthProfile(args: {
    count?: number;
    type?: string;
    flags?: string;
}): Promise<string>;
/** Which types actually have a joke waiting, and how often, by sampling the endpoint that asks for each. */
export declare function jokeTypeCoverage(args: {
    samples?: number;
}): Promise<string>;

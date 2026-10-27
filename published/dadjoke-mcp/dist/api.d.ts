export declare class DadJokeError extends Error {
}
export interface Joke {
    id: string;
    joke: string;
}
export declare function randomJoke(): Promise<Joke>;
export declare function searchJokes(term: string, limit?: number): Promise<Joke[]>;
export declare function getJoke(id: string): Promise<Joke>;

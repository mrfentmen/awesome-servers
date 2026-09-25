export declare class CocktailError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchCocktails(query: string): Promise<string>;
export declare function getCocktail(id: string): Promise<string>;
export declare function randomCocktail(): Promise<string>;
export declare function listIngredients(): Promise<string>;

export declare class CocktailError extends Error {
}
export declare function searchCocktails(name: string, limit: number): Promise<string>;
export declare function cocktailDetail(id: string): Promise<string>;
export declare function randomCocktail(): Promise<string>;
export declare function browseByLetter(letter: string, limit: number): Promise<string>;
export declare function listIngredients(limit: number): Promise<string>;
export declare function listFilters(): Promise<string>;

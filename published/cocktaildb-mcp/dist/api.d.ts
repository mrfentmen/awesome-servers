export declare class CocktailError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export interface SearchArgs {
    query: string;
    limit?: number;
}
export declare function searchCocktails(args: SearchArgs): Promise<string>;
export declare function getCocktail(id: string): Promise<string>;
export declare function randomCocktail(count?: number): Promise<string>;
export interface IngredientListArgs {
    search?: string;
    limit?: number;
}
export declare function listIngredients(args?: IngredientListArgs): Promise<string>;
export interface FilterArgs {
    by: string;
    value: string;
    limit?: number;
}
export declare function filterCocktails(args: FilterArgs): Promise<string>;
export declare function ingredientInfo(name: string): Promise<string>;
export declare function listFilters(kind?: string): Promise<string>;
export declare function searchByLetter(letter: string, limit?: number): Promise<string>;
export declare function filterMultiIngredient(ingredients: string, limit?: number): Promise<string>;
export interface RecordAuditArgs {
    id: string;
}
export interface CatalogueIndexArgs {
    refresh?: string;
}
/** The A to Z shape of what the free API will actually serve, including which letters are truncated. */
export declare function catalogueIndex(args?: CatalogueIndexArgs): Promise<string>;
export interface NameVariantsArgs {
    refresh?: string;
    top?: number;
    min_family?: number;
}

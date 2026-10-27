export declare class SpoonacularError extends Error {
}
export interface Recipe {
    id: number;
    title?: string;
    minutes?: number;
    servings?: number;
    image?: string;
}
export declare function searchRecipes(query: string, limit?: number): Promise<Recipe[]>;
export declare function getRecipe(id: string): Promise<string>;
export declare function guessNutrition(text: string): Promise<string>;
export declare function formatRecipe(r: Recipe, index?: number): string;

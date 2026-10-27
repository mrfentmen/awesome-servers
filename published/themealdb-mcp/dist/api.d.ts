export declare class MealError extends Error {
}
export declare function searchMeals(name: string, limit: number): Promise<string>;
export declare function mealDetail(id: string): Promise<string>;
export declare function randomMeal(): Promise<string>;
export declare function byCategory(category: string, limit: number): Promise<string>;
export declare function byArea(area: string, limit: number): Promise<string>;
export declare function byMainIngredient(ingredient: string, limit: number): Promise<string>;
export declare function listOptions(): Promise<string>;

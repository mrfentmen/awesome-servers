export declare class NutritionixError extends Error {
}
export interface Food {
    name: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    serving?: string;
}
export declare function searchFoods(query: string, limit?: number): Promise<Food[]>;
export declare function analyzeMeal(text: string): Promise<Food[]>;
export declare function formatFood(f: Food, index?: number): string;

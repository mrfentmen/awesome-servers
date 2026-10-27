export declare class FoodError extends Error {
}
export declare function product(barcode: string): Promise<any>;
export declare function search(query: string, page?: string): Promise<any>;
export declare function format(x: unknown): string;

export declare class CGTraderError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listModels(page?: string): Promise<string>;
export declare function getModel(modelId: string): Promise<string>;
export declare function listModelFiles(modelId: string): Promise<string>;
export declare function getMe(): Promise<string>;
export interface TreeArgs {
    parent_id?: number;
    depth?: number;
    min_children?: number;
}
export interface PathArgs {
    category: string;
}
/** GET /v1/categories/{id} - one category with its breadcrumb, children and siblings. */
export declare function categoryPath(args: PathArgs): Promise<string>;
export interface ProfileArgs {
    min_descendants?: number;
}

export declare class ShootProofError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getServiceDescription(): Promise<string>;
export declare function getMe(): Promise<string>;
export declare function listBrands(): Promise<string>;
export declare function listBrandEvents(brandId: string): Promise<string>;
export declare function listBrandOrders(brandId: string): Promise<string>;

export declare class StripeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listCharges(limit?: string): Promise<string>;
export declare function listCustomers(limit?: string): Promise<string>;
export declare function getBalance(): Promise<string>;
export declare function listInvoices(limit?: string): Promise<string>;
export declare function listSubscriptions(limit?: string): Promise<string>;
export declare function listProducts(limit?: string): Promise<string>;
export declare function listPrices(limit?: string): Promise<string>;
export declare function listRefunds(limit?: string): Promise<string>;
export declare function listDisputes(limit?: string): Promise<string>;
export declare function listCoupons(limit?: string): Promise<string>;

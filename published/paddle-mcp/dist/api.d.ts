export declare class PaddleError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProducts(): Promise<string>;
export declare function getProduct(productId: string): Promise<string>;
export declare function listPrices(productId?: string): Promise<string>;
/**
 * The whole daily reference board for one base currency, newest rates first.
 * Frankfurter serves the European Central Bank's daily reference rates, so a
 * Paddle price list can be shown in the currencies a merchant actually bills in.
 */
export declare function listFxRates(args: {
    base?: string;
}): Promise<string>;
/**
 * One amount converted between two currencies at the latest published rate,
 * which is the figure a merchant of record needs before pricing a sale.
 */
export declare function convertAmount(args: {
    amount: number;
    from: string;
    to: string;
}): Promise<string>;
/**
 * How a pair has moved over a window: the daily series summarised into a
 * start, end, high, low and mean, which is what a monthly billing report needs.
 */
export declare function fxRateHistory(args: {
    from: string;
    to: string;
    days?: number;
}): Promise<string>;

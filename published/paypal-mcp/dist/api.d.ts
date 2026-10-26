export declare class PaypalError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getOrder(orderId: string): Promise<string>;
export declare function getCapture(captureId: string): Promise<string>;
export declare function listPlans(): Promise<string>;
export declare function planDetails(planId: string): Promise<string>;
export declare function listProducts(): Promise<string>;
export declare function productDetails(productId: string): Promise<string>;
export declare function subscriptionDetails(subscriptionId: string): Promise<string>;
export declare function payoutDetails(payoutId: string): Promise<string>;
export declare function listWebhooks(): Promise<string>;
export declare function disputeDetails(disputeId: string): Promise<string>;
/**
 * The payout picture for one market: the World Bank's official exchange rate
 * against the dollar, its income tier, and where its currency has moved over
 * the last five published years.
 */
export declare function payoutMarketProfile(args: {
    country: string;
}): Promise<string>;
/**
 * The year-by-year official rate for one market, with the change each year and
 * the cumulative move, which is the series a payout schedule is forecast on.
 */
export declare function payoutFxTrend(args: {
    country: string;
    years?: number;
}): Promise<string>;
/**
 * Rank markets for a payout programme: the economies in one region or income
 * tier, each with its official rate and how far it has moved this decade.
 */
export declare function payoutMarketScan(args: {
    region?: string;
    income_level?: string;
    limit?: number;
}): Promise<string>;

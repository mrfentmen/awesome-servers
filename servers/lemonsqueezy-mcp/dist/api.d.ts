export declare class LemonError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listStores(): Promise<string>;
export declare function listProducts(storeId?: string): Promise<string>;
export declare function getProduct(productId: string): Promise<string>;
export interface FeeBreakdownArgs {
    gross: number;
    percentage_fee?: number;
    fixed_fee?: number;
    currency_fee?: number;
    tax_withheld?: number;
    refund?: number;
    currency?: string;
}
/** Where a sale's money actually goes: every fee, the net payout, the effective take rate and the size of sale that pays for the fixed fees. */
export declare function feeBreakdown(args: FeeBreakdownArgs): Promise<string>;
export interface PayoutScheduleArgs {
    cadence: string;
    min_threshold?: number;
    reserve_rate?: number;
    periods?: number;
    starting_balance?: number;
    currency?: string;
    from_date?: string;
}
/** When money would actually arrive: the payout cadence, the minimum threshold and any rolling reserve, worked out over real dates. */
export declare function payoutSchedule(args: PayoutScheduleArgs): Promise<string>;

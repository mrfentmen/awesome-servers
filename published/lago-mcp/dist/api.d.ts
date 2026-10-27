export declare class LagoError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listPlans(limit?: string): Promise<string>;
export declare function listCustomers(limit?: string): Promise<string>;
export declare function listInvoices(limit?: string): Promise<string>;
export interface InvoiceArithmeticArgs {
    invoice: string;
}
/**
 * Recomputes an invoice from its own line items. Nothing is fetched: this checks
 * the arithmetic a billing system has to get right, line by line.
 */
export declare function invoiceArithmetic(args: InvoiceArithmeticArgs): Promise<string>;
export interface UsageBillArgs {
    base_price: number;
    included_units: number;
    overage_unit_price: number;
    usage: number;
    hard_cap_units?: number;
    minimum_charge?: number;
    currency?: string;
}
/**
 * Prices one usage bill against an included-then-overage plan, and shows the
 * curve at a few usage levels so the break-even is visible.
 */
export declare function usageBill(args: UsageBillArgs): Promise<string>;

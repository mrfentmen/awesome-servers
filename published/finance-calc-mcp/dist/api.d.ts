export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function loanPayment(a: {
    principal: number;
    annualRatePercent: number;
    years: number;
}): Promise<string>;
export declare function compoundInterest(a: {
    principal: number;
    annualRatePercent: number;
    years: number;
    compoundsPerYear: number;
}): Promise<string>;
export declare function netPresentValue(a: {
    ratePercent: number;
    cashflows: number[];
}): Promise<string>;

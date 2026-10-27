export declare class FrankfurterError extends Error {
}
export declare function currencies(): Promise<string>;
export declare function latest(base: string, symbols?: string[]): Promise<string>;
export declare function convert(amount: number, from: string, to: string): Promise<string>;
export declare function history(from: string, to: string, days: number): Promise<string>;
export declare function dateRate(date: string, from: string, to?: string): Promise<string>;
export declare function compare(currenciesList: string[], days: number): Promise<string>;

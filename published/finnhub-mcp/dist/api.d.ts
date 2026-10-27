export declare class FinnhubError extends Error {
}
export declare function stockQuote(symbol: string): Promise<string>;
export declare function companyNews(symbol: string, days?: number): Promise<string[]>;
export declare function earningsCalendar(days?: number): Promise<string[]>;

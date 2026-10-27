export declare class ShynetError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getDashboard(startDate?: string, endDate?: string): Promise<string>;
export declare function getServiceStats(uuid: string, startDate?: string, endDate?: string): Promise<string>;

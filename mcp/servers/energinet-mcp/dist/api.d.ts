export declare class EnerginetError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getPowerNow(limit?: number): Promise<string>;
export declare function getDataset(dataset: string, limit?: number): Promise<string>;
export declare function datasetCatalog(args: {
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function datasetSchema(args: {
    dataset: string;
    limit?: number;
}): Promise<string>;

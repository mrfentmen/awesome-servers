export declare class NhtsaError extends Error {
}
export declare function decodeVin(input: string): Promise<string>;
export declare function recalls(make: string, model: string, year: number): Promise<string>;
export declare function complaints(make: string, model: string, year: number): Promise<string>;
export declare function listMakes(year: number): Promise<string>;
export declare function listModels(make: string, year: number): Promise<string>;

export declare class MgmError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProvinces(): Promise<string>;
export declare function listDistricts(il: string): Promise<string>;
export declare function getDaily(istno: string): Promise<string>;
export declare function getHourly(istno: string): Promise<string>;
export interface CurrentConditionsArgs {
    istno: string;
}
export declare function currentConditions(args: CurrentConditionsArgs): Promise<string>;
export interface ProvinceBoardArgs {
    il: string;
    days?: number;
    limit?: number;
}
export declare function provinceBoard(args: ProvinceBoardArgs): Promise<string>;

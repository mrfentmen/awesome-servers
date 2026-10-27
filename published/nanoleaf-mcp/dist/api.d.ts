export declare class NanoleafError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getInfo(): Promise<string>;
export declare function getState(): Promise<string>;
export declare function setPower(on: boolean): Promise<string>;
export declare function getEffects(): Promise<string>;

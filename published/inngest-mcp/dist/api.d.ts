export declare class InngestError extends Error {
}
type Raw = Record<string, any>;
export declare function sendEvent(name: string, data: Raw): Promise<string>;
export interface App {
    id?: string;
    name?: string;
    url?: string;
}
export declare function listApps(): Promise<App[]>;
/** The published Inngest SDK surface: what is out there, how big it is, and how it is doing. */
export declare function sdkMatrix(args: {
    "package"?: string;
}): Promise<string>;
export {};
